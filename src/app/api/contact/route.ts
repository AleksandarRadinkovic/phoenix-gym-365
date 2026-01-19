import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { name, email, phone, message } = await request.json();

    console.log('=== FORM DATA ===');
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Phone:', phone);
    console.log('Message:', message);

    if (!name || !email || !phone || !message) {
      return NextResponse.json(
        { error: 'Sva polja su obavezna' },
        { status: 400 }
      );
    }

    console.log('=== SMTP CONFIG ===');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('Port:', process.env.SMTP_PORT);
    console.log('User:', process.env.SMTP_USER);
    console.log('Pass exists:', !!process.env.SMTP_PASS);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    console.log('=== SENDING EMAIL ===');

    const mailOptions = {
      from: 'info@phoenixgym365.com',
      to: 'info@phoenixgym365.com',
      replyTo: email,
      subject: `Nova poruka sa sajta - ${name}`,
      html: `
        <h2>Nova kontakt poruka</h2>
        <p><strong>Ime:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Telefon:</strong> ${phone}</p>
        <p><strong>Poruka:</strong></p>
        <p>${message}</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('=== EMAIL SENT ===');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);

    return NextResponse.json(
      { message: 'Email uspješno poslan' },
      { status: 200 }
    );
  } catch (error) {
    console.error('=== EMAIL ERROR ===');
    console.error(error);
    return NextResponse.json(
      { error: 'Greška pri slanju emaila' },
      { status: 500 }
    );
  }
}
