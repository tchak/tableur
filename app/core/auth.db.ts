import { prisma } from '~/services/db';
import { email } from '~/services/email';
import { generateOTP, now, timeAgo } from '~/utils';
import type {
  LoginRequestCreateInput,
  LoginRequestVerifyInput,
} from './auth.types';

export async function loginRequestCreate(input: LoginRequestCreateInput) {
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
}

export async function loginRequestVerify(input: LoginRequestVerifyInput) {
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
}
