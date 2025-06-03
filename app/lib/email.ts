import { createTransport } from 'nodemailer';

export interface EmailTransport {
  send(options: {
    from: string;
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<void>;
}

function initTestTransport(): EmailTransport {
  const transport = createTransport({
    jsonTransport: true,
  });
  return {
    async send(options) {
      try {
        const info = await transport.sendMail(options);
        console.log(info.message);
      } catch (error) {
        console.error(error);
      }
    },
  };
}

function initEmailTransport(): EmailTransport {
  return initTestTransport();
}

export const email = initEmailTransport();
