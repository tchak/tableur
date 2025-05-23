import * as v from 'valibot';

import { prisma } from '~/services/db';
import { email } from '~/services/email';
import { base } from '~/services/rpc';
import { generateOTP, now, timeAgo } from '~/utils';

import { Email } from './types';

export const LoginRequestCreateInput = v.object({ email: Email });
export const LoginRequestVerifyInput = v.object({
  email: Email,
  otp: v.pipe(v.string(), v.length(6)),
});

export const loginRequestCreate = base
  .input(LoginRequestCreateInput)
  .handler(async ({ input }) => {
    const request = await prisma.loginRequest.create({
      data: { email: input.email, otp: generateOTP() },
      select: { email: true, otp: true },
    });
    await email.send({
      from: 'noreply@example.com',
      to: request.email,
      subject: 'Login Request',
      text: `Your login request OTP is ${request.otp}`,
    });
  })
  .callable({ context: {} });

export const loginRequestVerify = base
  .input(LoginRequestVerifyInput)
  .handler(async ({ input }) => {
    const request = await prisma.loginRequest.findUnique({
      where: {
        email_otp: input,
        createdAt: { gt: timeAgo('15 min') },
      },
      select: { id: true, email: true },
    });
    if (request) {
      const [, user] = await prisma.$transaction([
        prisma.loginRequest.delete({ where: { id: request.id } }),
        prisma.user.upsert({
          where: { email: request.email },
          create: { email: request.email, confirmedAt: now() },
          update: {},
          select: { id: true, email: true },
        }),
      ]);
      return user;
    } else {
      return null;
    }
  })
  .callable({ context: {} });
