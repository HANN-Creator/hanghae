const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { createCanvas, loadImage } = require('canvas');

const app = express();
app.use(cors());
app.use(express.json());

// Temporary in-memory store for wallets, votes, and verification codes (in production, use a proper database)
const wallets = {};
votes = {};
const verificationCodes = {};

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'jhlove4061@gwnu.ac.kr',
    pass: '@jeahan2001@',
  },
});

// 후보자 이름 목록
const candidates = {
  'Candidate 1': '김건모',
  'Candidate 2': '정현빈',
  'Candidate 3': '멀티과 손흥민 이강인',
  'Candidate 4': '흥사차력쇼',
  'Candidate 5': '제훈파티시엘',
  'Candidate 6': '흐',
  'Candidate 7': '김유민',
};

// Endpoint to generate wallet and send verification email
app.post('/generate-wallet', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).send('Email is required');
  }

  // Generate a verification code
  const verificationCode = crypto.randomBytes(3).toString('hex');
  verificationCodes[email] = verificationCode;

  // Send verification email with styled HTML content including two images and the verification code between them
  const mailOptions = {
    from: 'your-email@gmail.com',
    to: email,
    subject: '강릉원주대학교 과학기술대학 별하제 장기자랑 투표 인증번호입니다.',
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <h1 style="color: #4CAF50; font-size: 28px; font-weight: normal;">강릉원주대학교 과학기술대학 별하제 장기자랑 투표 인증</h1>
        <p style="font-size: 16px;">안녕하세요! 요청하신 인증번호는 아래에 있습니다. 이 코드는 보안상 5분 이내에 사용해 주시기 바랍니다.</p>
        <div style="margin: 10px 0;">
          <img src="cid:image1" style="max-width: 100%; height: auto;" />
        </div>
        <div style="font-size: 20px; font-weight: normal; margin: 10px 0;">
          인증번호: ${verificationCode}
        </div>
        <div style="margin: 10px 0;">
          <img src="cid:image2" style="max-width: 100%; height: auto;" />
        </div>
        <p style="font-size: 14px; color: #777;">이 메일을 요청하지 않으셨다면, 이 메일을 무시해 주세요.</p>
        <p style="font-size: 14px; color: #777;">감사합니다.<br/>강릉원주대학교 과학기술대학 항해 드림</p>
      </div>
    `,
    attachments: [
      {
        filename: 'image1.png',
        path: 'up-001.png',
        cid: 'image1',
      },
      {
        filename: 'image2.png',
        path: 'down-001 (3).png',
        cid: 'image2',
      },
    ],
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Failed to send email:', error); // Log the error for debugging
      return res.status(500).send('이메일로 보내지 못했습니다.');
    } else {
      console.log('Email sent:', info.response); // Log the response for debugging
      res.status(200).send('이메일로 보냈습니다.');
    }
  });
});

// Endpoint to verify code and generate wallet
app.post('/verify-code', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).send('이메일 및 코드가 필요합니다.');
  }

  if (verificationCodes[email] !== code) {
    return res.status(400).send('유효하지 않는 인증 코드입니다.');
  }

  // Generate a new wallet
  const wallet = ethers.Wallet.createRandom();
  wallets[email] = wallet;

  // Clear the verification code after successful verification
  delete verificationCodes[email];

  res.status(200).send({ address: wallet.address });
});

// Endpoint to vote
app.post('/vote', (req, res) => {
  const { email, candidate } = req.body;
  const wallet = wallets[email];

  if (!wallet) {
    return res.status(400).send('오류가 발생했습니다.');
  }

  if (votes[email]) {
    return res.status(400).send('이미 투표를 완료했습니다.');
  }

  // Register the vote
  votes[email] = candidate;

  const candidateName = candidates[candidate] || candidate;

  console.log(`투표 등록: ${email} 님이 ${candidateName} 후보에게 투표했습니다.`); // Log the vote for debugging

  // Log the current vote tally
  logCurrentVoteTally();

  res.status(200).send(`지갑 주소 ${wallet.address} 로 ${candidateName} 에게 투표 완료했습니다.`);
});

// Endpoint to get real-time vote counts
app.get('/results', (req, res) => {
  const results = {};
  Object.values(votes).forEach((candidate) => {
    const candidateName = candidates[candidate] || candidate;

    if (!results[candidateName]) {
      results[candidateName] = 0;
    }
    results[candidateName] += 1;
  });

  console.log('현재 투표 결과:', results); // Log the results for debugging

  res.status(200).send(results);
});

// Function to log the current vote tally
function logCurrentVoteTally() {
  const results = {};
  Object.values(votes).forEach((candidate) => {
    const candidateName = candidates[candidate] || candidate;

    if (!results[candidateName]) {
      results[candidateName] = 0;
    }
    results[candidateName] += 1;
  });

  console.log('현재 총 투표 집계:', results); // Log the current tally
}

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});