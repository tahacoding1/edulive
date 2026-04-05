const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
});

const base = `font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;`;

const sendOTP = async (to, otp) => {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: '🔐 EduLive — Password Reset OTP',
    html: `<div style="${base}">
      <div style="background:linear-gradient(135deg,#2979ff,#00d4ff);padding:32px;text-align:center;border-radius:12px 12px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:26px;font-weight:900;">◈ EduLive</h1>
        <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;">Password Reset OTP</p>
      </div>
      <div style="background:#0c1228;padding:36px;border-radius:0 0 12px 12px;border:1px solid #1c2d4f;border-top:none;">
        <p style="color:#7a93c0;font-size:15px;">Your One-Time Password to reset your EduLive password:</p>
        <div style="background:#162040;border:1px solid #1c2d4f;border-radius:12px;padding:28px;text-align:center;margin:20px 0;">
          <span style="font-size:44px;font-weight:900;letter-spacing:14px;color:#2979ff;font-family:monospace;">${otp}</span>
        </div>
        <p style="color:#7a93c0;font-size:13px;">Expires in <strong style="color:#ffb300;">10 minutes</strong>. Do not share this OTP with anyone.</p>
        <p style="color:#3d5478;font-size:12px;margin-top:28px;">If you did not request this, please ignore this email.</p>
      </div>
    </div>`,
  });
};

const sendClassCreated = async (to, teacherName, roomName, roomId, password) => {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: `🏫 EduLive — Classroom "${roomName}" Ready!`,
    html: `<div style="${base}">
      <div style="background:linear-gradient(135deg,#2979ff,#00d4ff);padding:32px;text-align:center;border-radius:12px 12px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:26px;font-weight:900;">◈ EduLive</h1>
        <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;">Your Classroom is Ready!</p>
      </div>
      <div style="background:#0c1228;padding:36px;border-radius:0 0 12px 12px;border:1px solid #1c2d4f;border-top:none;">
        <p style="color:#dce8ff;font-size:16px;">Hello <strong>${teacherName}</strong> 👋</p>
        <p style="color:#7a93c0;font-size:14px;">Share these credentials with your students:</p>
        <div style="background:#162040;border:1px solid #1c2d4f;border-radius:12px;padding:24px;margin:20px 0;">
          <p style="color:#7a93c0;font-size:11px;text-transform:uppercase;letter-spacing:.1em;margin:0 0 4px;">Classroom</p>
          <p style="color:#dce8ff;font-size:18px;font-weight:700;margin:0 0 18px;">${roomName}</p>
          <p style="color:#7a93c0;font-size:11px;text-transform:uppercase;letter-spacing:.1em;margin:0 0 4px;">Room ID</p>
          <p style="color:#2979ff;font-size:28px;font-weight:900;letter-spacing:4px;font-family:monospace;margin:0 0 18px;">${roomId}</p>
          <p style="color:#7a93c0;font-size:11px;text-transform:uppercase;letter-spacing:.1em;margin:0 0 4px;">Password</p>
          <p style="color:#00d4ff;font-size:22px;font-weight:700;letter-spacing:2px;font-family:monospace;margin:0;">${password}</p>
        </div>
        <p style="color:#3d5478;font-size:12px;margin-top:28px;">© EduLive Virtual Classroom Platform</p>
      </div>
    </div>`,
  });
};

module.exports = { sendOTP, sendClassCreated };
