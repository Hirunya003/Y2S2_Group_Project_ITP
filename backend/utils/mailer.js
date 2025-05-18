import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendMail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: '"SuperMart" <no-reply@SuperMart.com>',
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};
