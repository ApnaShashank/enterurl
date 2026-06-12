import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Feedback from '@/models/Feedback';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  let ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  try {
    await connectToDatabase();

    const body = await request.json();
    const { url, errorMessage, feedbackText } = body;

    if (!feedbackText) {
      return NextResponse.json({ success: false, error: 'Feedback text is required' }, { status: 400 });
    }

    // Save to MongoDB
    const feedbackDoc = await Feedback.create({
      ip,
      url,
      errorMessage,
      feedbackText,
      timestamp: new Date()
    });

    console.log(`Saved feedback doc: ${feedbackDoc._id}`);

    // Attempt to send email if SMTP details are configured
    const smtpUser = process.env.SMTP_USER || '';
    const smtpPass = process.env.SMTP_PASS || '';
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
    const developerEmail = 'shashank8808108802@gmail.com';

    let emailSent = false;
    if (smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        });

        await transporter.sendMail({
          from: `"EnterURL Feedback" <${smtpUser}>`,
          to: developerEmail,
          subject: `🚨 EnterURL Error/Feedback Report`,
          text: `Hi Shashank,\n\nA user reported an issue on EnterURL.\n\nFeedback Details:\n- IP: ${ip}\n- URL: ${url || 'N/A'}\n- Error Message: ${errorMessage || 'N/A'}\n- Timestamp: ${new Date().toLocaleString()}\n\nUser Message:\n${feedbackText}\n\nCheck the Admin Panel at https://enterurl.vercel.app/adminpanel for all logs.`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eaeaea; border-radius: 10px;">
              <h2 style="color: #6d28d9; margin-bottom: 20px;">🚨 EnterURL Error/Feedback Report</h2>
              <p>Hi Shashank,</p>
              <p>A user submitted a new feedback/error report via the website.</p>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 8px; font-weight: bold; width: 150px;">IP Address:</td>
                  <td style="padding: 8px; font-family: monospace;">${ip}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">URL Scanned:</td>
                  <td style="padding: 8px;"><a href="${url}">${url || 'N/A'}</a></td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 8px; font-weight: bold;">Error Message:</td>
                  <td style="padding: 8px; color: #dc2626; font-family: monospace;">${errorMessage || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Timestamp:</td>
                  <td style="padding: 8px;">${new Date().toLocaleString()}</td>
                </tr>
              </table>
              <div style="background-color: #f5f3ff; border-left: 4px solid #7c3aed; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; color: #5b21b6;">User Comments:</h4>
                <p style="margin: 0; line-height: 1.5; font-style: italic;">"${feedbackText}"</p>
              </div>
              <p style="font-size: 12px; color: #666; border-top: 1px solid #eaeaea; pt-15px; margin-top: 20px;">
                This feedback has also been logged to your MongoDB. View logs at the <a href="https://enterurl.vercel.app/adminpanel">Admin Panel</a>.
              </p>
            </div>
          `
        });
        emailSent = true;
        console.log('Feedback email notification sent successfully.');
      } catch (mailErr: any) {
        console.error('SMTP sending failed, logged to DB instead:', mailErr.message);
      }
    }

    return NextResponse.json({ success: true, loggedToDb: true, emailSent });

  } catch (error: any) {
    console.error('Feedback submit handler failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
