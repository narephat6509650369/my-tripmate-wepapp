import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (to: string, subject: string,text: string, html?: string) => {
  try {
    await transporter.sendMail({
      from: `"TripMate" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent successfully");
    return { success: true };

  } catch (error) {
    console.error("Email error:", error);
    return { success: false };
  }
};
