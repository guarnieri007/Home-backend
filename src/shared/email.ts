import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465, // 465 = TLS direto; 587 = STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  para: string;
  assunto: string;
  html: string;
  texto: string;
}

export async function enviarEmail({ para, assunto, html, texto }: EmailOptions) {
  return transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: para,
    subject: assunto,
    html,
    text: texto, // sempre inclua versão em texto puro
  });
}