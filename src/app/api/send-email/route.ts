import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// SendGrid APIキーを設定
if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY is not defined in .env.local");
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function POST(req: Request) {
  const toEmail = process.env.SENDGRID_TO_EMAIL;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  const autoReplyTemplateId = process.env.SENDGRID_AUTOREPLY_TEMPLATE_ID;

  if (!toEmail || !fromEmail || !autoReplyTemplateId) {
    console.error("Email environment variables are not set.");
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    // リクエストボディからフォームデータを取得
    const body = await req.json();
    const { name, email, message } = body;

    // バリデーション
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // A. 管理者への通知メール
    const adminMail = {
      to: toEmail, // あなたが通知を受け取るメールアドレス
      from: fromEmail, // SendGridで認証した送信元メールアドレス
      subject: `【お問い合わせ】${name}様より`,
      html: `
        <p><strong>お名前:</strong> ${name}</p>
        <p><strong>メールアドレス:</strong> ${email}</p>
        <p><strong>お問い合わせ内容:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    };

    // B. ユーザーへの自動返信メール
    const userMail = {
      to: email,
      from: fromEmail,
      templateId: autoReplyTemplateId,
      dynamicTemplateData: {
        name,
        email,
        message,
      },
    };

    // A、Bを同時に送信
    await sgMail.send([adminMail, userMail]);
    return NextResponse.json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error('Error in send-email API:', error);
    return NextResponse.json({ error: 'Error sending message.' }, { status: 500 });
  }
}