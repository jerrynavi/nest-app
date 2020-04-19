import * as nodemailer from 'nodemailer';
import { Logger } from '@nestjs/common';

export const sendMail = async (message: string, subject: string, recipient: string): Promise<void> => {
  try {

    const transport = nodemailer.createTransport({
      host: 'your_server_host',
      port: 587,
      auth: {
        user: 'your_username',
        pass: 'your_password',
      },
      secure: false,
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transport.sendMail({
      html: message,
      text: message,
      to: recipient,
      from: 'Sammy <sammy@email.host>',
      subject,
    });
  } catch (error) {
    new Logger().error(error.message ?? error);
  }
}
