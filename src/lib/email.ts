import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await resend.emails.send({
    from: 'Lenote <no-reply@lenote.dev>',
    to: email,
    subject: 'Đặt lại mật khẩu Lenote',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Đặt lại mật khẩu</title>
        </head>
        <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout:fixed;">
            <tr>
              <td align="center" style="padding:40px 0;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:480px;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding:32px 32px 16px;">
                      <div style="font-size:24px;font-weight:800;color:#2563eb;letter-spacing:-0.5px;">Lenote</div>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding:0 32px 32px;">
                      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1e293b;line-height:1.2;">Đặt lại mật khẩu</h1>
                      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569;">
                        Chào bạn, chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong style="color:#1e293b;">${email}</strong>. 
                        Nếu đây là bạn, hãy nhấn vào nút bên dưới để tạo mật khẩu mới.
                      </p>
                      
                      <!-- Button -->
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="left">
                            <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;background-color:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;border-radius:12px;box-shadow:0 4px 6px -1px rgba(37,99,235,0.2);">
                              Đặt lại mật khẩu
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <div style="margin-top:24px;padding:16px;background-color:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
                        <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">
                          <strong>Lưu ý:</strong> Liên kết này sẽ hết hạn sau <span style="color:#2563eb;font-weight:600;">30 phút</span>. 
                          Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này một cách an toàn.
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding:24px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
                      <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
                        © ${new Date().getFullYear()} Lenote. Tiết kiệm thời gian, tối ưu tri thức.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
}
