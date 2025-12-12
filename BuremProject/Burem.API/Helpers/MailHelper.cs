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
        /// </summary>
        public void SendAppointmentEmail(string toEmail, string studentName, string therapistName, string date, string time, string type, string locationOrLink)
        {
            string subject = "BÜREM Randevu Bilgilendirmesi";
            string locationHtml = "";

            if (type == "Online")
            {
                locationHtml = $@"
                    <li><strong>Görüşme Türü:</strong> <span style='color:blue;'>Online (Çevrimiçi)</span></li>
                    <li><strong>Katılım Linki:</strong> <a href='{locationOrLink}' target='_blank'>{locationOrLink}</a></li>
                    <li><small><em>* Lütfen görüşme saatinde yukarıdaki linke tıklayarak bekleme odasına giriniz.</em></small></li>
                ";
            }
            else
            {
                locationHtml = $@"
                    <li><strong>Görüşme Türü:</strong> <span style='color:green;'>Yüz Yüze</span></li>
                    <li><strong>Görüşme Yeri:</strong> {locationOrLink}</li>
                    <li><small><em>* Lütfen randevu saatinden 5 dakika önce merkezimizde hazır bulununuz.</em></small></li>
                ";
            }

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
                    </div>

                    <br/>
                    <p>Sağlıklı günler dileriz,</p>
                    <p><strong>BÜREM</strong><br/>Boğaziçi Üniversitesi Rehberlik ve Psikolojik Danışmanlık Merkezi</p>
                </div>
            ";

            SendMail(toEmail, subject, body);
        }

        /// <summary>
        /// [YENİ] Terapiste yeni bir danışan atandığında gönderilen özel bilgilendirme maili.
        /// </summary>
        public void SendTherapistNotification(string toEmail, string therapistName, string studentName, string date, string time, string type, string locationOrLink)
        {
            string subject = "BÜREM - Yeni Danışan Randevusu";

            // Konum bilgisini netleştirelim
            string locationInfo = type == "Online"
                ? $"Online (<a href='{locationOrLink}'>Bağlantı</a>)"
                : $"{locationOrLink} (Yüz Yüze)";

            string body = $@"
                <div style='font-family: Arial, sans-serif; color: #333; line-height: 1.6;'>
                    <h3 style='color: #003366;'>Sayın {therapistName},</h3>
                    <p>Randevu takviminize yeni bir danışan görüşmesi eklenmiştir.</p>
                    
                    <div style='background-color: #e6f7ff; padding: 15px; border-left: 5px solid #1890ff; margin: 20px 0;'>
                        <h4 style='margin-top: 0; color: #003366;'>Randevu Bilgileri</h4>
                        <ul style='list-style-type: none; padding: 0;'>
                            <li><strong>Danışan Adı:</strong> {studentName}</li>
                            <li><strong>Tarih:</strong> {date}</li>
                            <li><strong>Saat:</strong> {time}</li>
                            <li><strong>Tür:</strong> {type}</li>
                            <li><strong>Yer/Link:</strong> {locationInfo}</li>
                        </ul>
                    </div>

                    <p>Detayları ve danışan dosyasını panelinizden görüntüleyebilirsiniz.</p>
                    <br/>
                    <p>İyi çalışmalar dileriz,<br/><strong>BÜREM Otomasyon Sistemi</strong></p>
                </div>
            ";

            SendMail(toEmail, subject, body);
        }

        public void SendEvaluationEmail(string toEmail, string studentName, string therapistName, string sessionDate)
        {
            string subject = "BÜREM - Görüşme Değerlendirme Formu";
            string evaluationLink = $"https://burembasvuru.bogazici.edu.tr/degerlendirme?student={toEmail}";

            string body = $@"
                <h3>Merhaba {studentName},</h3>
                <p>{sessionDate} tarihinde Uzman {therapistName} ile gerçekleştirdiğiniz görüşme tamamlanmıştır.</p>
                <p>Hizmet kalitemizi artırmak amacıyla görüşmenizi değerlendirmeniz bizim için önemlidir.</p>
                <p><a href='{evaluationLink}'>Değerlendirme Formunu Doldurmak İçin Tıklayınız</a></p>
                <br>
                <p>Sağlıklı günler dileriz,<br>BÜREM Yönetimi</p>";

            SendMail(toEmail, subject, body);
        }

        public void SendCancellationEmail(string toEmail, string recipientName, string date, string time, string reason)
        {
            string subject = "BÜREM - Randevu İptal Bilgilendirmesi";
            string body = $@"
                <h3>Sayın {recipientName},</h3>
                <p>{date} saat {time} tarihindeki randevu aşağıdaki nedenle <strong>iptal edilmiştir</strong>:</p>
                <div style='background-color: #fff1f0; border: 1px solid #ffa39e; padding: 10px; margin: 10px 0;'>
                    <strong>İptal Nedeni:</strong> {reason}
                </div>
                <p>Bilgilerinize sunarız.</p>
                <br>
                <p>BÜREM Yönetimi</p>";

            SendMail(toEmail, subject, body);
        }

        private void SendMail(string toEmail, string subject, string body)
        {
            var host = _configuration["MailSettings:Host"];
            var port = int.Parse(_configuration["MailSettings:Port"]);
            var mailFrom = _configuration["MailSettings:MailFrom"];
            var displayName = _configuration["MailSettings:DisplayName"];
            var username = _configuration["MailSettings:Username"];
            var password = _configuration["MailSettings:Password"];

            var smtpClient = new SmtpClient(host)
            {
                Port = port,
                EnableSsl = true,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(username, password)
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(mailFrom, displayName),
                Subject = subject,
                Body = body,
                IsBodyHtml = true,
            };

            mailMessage.To.Add(toEmail);
            try
            {
                smtpClient.Send(mailMessage);
            }
            catch
            {
                // Loglama yapılabilir
            }
        }
    }
}