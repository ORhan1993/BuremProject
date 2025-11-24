using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;

namespace Burem.API.Helpers
{
    public class MailHelper
    {
        private readonly IConfiguration _configuration;

        public MailHelper(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        /// <summary>
        /// Öğrenciye randevu bilgilendirme maili atar.
        /// Analiz dokümanına göre Online/Yüz Yüze ayrımı yapar.
        /// </summary>
        public void SendAppointmentEmail(string toEmail, string studentName, string therapistName, string date, string time, string type, string locationOrLink)
        {
            string subject = "BÜREM Randevu Bilgilendirmesi";
            string locationHtml = "";

            // --- ANALİZE GÖRE FORMAT AYRIMI ---
            if (type == "Online")
            {
                // Online ise Link olarak göster
                locationHtml = $@"
                    <li><strong>Görüşme Türü:</strong> <span style='color:blue;'>Online (Çevrimiçi)</span></li>
                    <li><strong>Katılım Linki:</strong> <a href='{locationOrLink}' target='_blank'>{locationOrLink}</a></li>
                    <li><small><em>* Lütfen görüşme saatinde yukarıdaki linke tıklayarak bekleme odasına giriniz.</em></small></li>
                ";
            }
            else
            {
                // Yüz Yüze ise Oda/Yer bilgisi göster
                locationHtml = $@"
                    <li><strong>Görüşme Türü:</strong> <span style='color:green;'>Yüz Yüze</span></li>
                    <li><strong>Görüşme Yeri:</strong> {locationOrLink}</li>
                    <li><small><em>* Lütfen randevu saatinden 5 dakika önce merkezimizde hazır bulununuz.</em></small></li>
                ";
            }

            // --- ORTAK ŞABLON ---
            string body = $@"
                <div style='font-family: Arial, sans-serif; color: #333; line-height: 1.6;'>
                    <h3 style='color: #003366;'>Sayın {studentName},</h3>
                    <p>BÜREM'e yaptığınız başvuru değerlendirilmiş ve uzmanımız tarafından adınıza randevu oluşturulmuştur.</p>
                    
                    <div style='background-color: #f9f9f9; padding: 15px; border-left: 5px solid #003366; margin: 20px 0;'>
                        <h4 style='margin-top: 0; color: #003366;'>Randevu Detayları</h4>
                        <ul style='list-style-type: none; padding: 0;'>
                            <li><strong>Uzman:</strong> {therapistName}</li>
                            <li><strong>Tarih:</strong> {date}</li>
                            <li><strong>Saat:</strong> {time}</li>
                            {locationHtml}
                        </ul>
                    </div>

                    <div style='background-color: #fff0f0; padding: 10px; border: 1px solid #ffcccc; color: #d8000c; font-size: 13px; margin-bottom: 20px;'>
                        <strong>⚠️ ÖNEMLİ UYARI:</strong><br>
                        Randevunuza gelemeyecek olursanız lütfen en geç <strong>24 saat önceden</strong> haber veriniz.
                        Haber verilmeden gelinmeyen randevular, danışmanlık sürecinizin işleyişini olumsuz etkileyebilir ve yeniden randevu almanızı zorlaştırabilir.
                    </div>

                    <p>Sorularınız için bize bu mail adresinden veya aşağıdaki telefon numarasından ulaşabilirsiniz.</p>

                    <br/>
                    <p>Sağlıklı günler dileriz,</p>
                    <p>
                        <strong>BÜREM</strong><br/>
                        Boğaziçi Üniversitesi Rehberlik ve Psikolojik Danışmanlık Merkezi<br/>
                        <a href='http://burem.bogazici.edu.tr'>http://burem.bogazici.edu.tr</a><br/>
                        Tel: 0212 359 71 39
                    </p>
                </div>
            ";

            SendMail(toEmail, subject, body);
        }

        private void SendMail(string toEmail, string subject, string body)
        {
            try
            {
                // SMTP Ayarları (Gerçek sunucu ayarlarınızı buraya veya appsettings.json'a girin)
                var smtpClient = new SmtpClient("smtp.bogazici.edu.tr")
                {
                    Port = 587,
                    Credentials = new NetworkCredential("burem@bogazici.edu.tr", "SIFRE_BURAYA"),
                    EnableSsl = true,
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress("burem@bogazici.edu.tr", "BÜREM"),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true,
                };

                mailMessage.To.Add(toEmail);

                smtpClient.Send(mailMessage);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Mail Hatası: " + ex.Message);
                // Log mekanizmasına yazılabilir
            }
        }
    }
}