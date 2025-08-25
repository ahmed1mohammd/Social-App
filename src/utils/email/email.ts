import nodemailer from "nodemailer";

//Nodemailer transport 
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

//Send generic email 
export const sendEmail = async (to: string, subject: string, html: string) => {
  return transporter.sendMail({ from: `"Social-App" <${process.env.EMAIL_USER}>`, to, subject, html });
};
