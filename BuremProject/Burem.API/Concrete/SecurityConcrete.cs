using Burem.API.Abstract;
using Burem.Data;
using Burem.Data.Models;

namespace Burem.API.Concrete
{

    public class SecurityConcrete : ISecurityService
    {
        private readonly BuremDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        // Şifreleme anahtarınız (değiştirilmemeli)
        public string SharedSecret => "CRn9cNujr3nKvYSY";

        // Constructor Injection: Veritabanı ve HttpContext otomatik olarak buraya gelir.
        public SecurityConcrete(BuremDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        public void AddLog(string actionToSave)
        {
            try
            {
                var context = _httpContextAccessor.HttpContext;
                string ipInfo = "Bilinmiyor";
                string userName = "Anonim";

                if (context != null)
                {
                    // --- 1. IP Adresi Alma (Modern Yöntem) ---
                    var remoteIp = context.Connection.RemoteIpAddress?.ToString();

                    // Proxy arkasındaysa X-Forwarded-For başlığını kontrol et
                    if (context.Request.Headers.ContainsKey("X-Forwarded-For"))
                    {
                        string proxyIp = context.Request.Headers["X-Forwarded-For"];
                        ipInfo = $"{remoteIp} Proxy: {proxyIp}";
                    }
                    else
                    {
                        ipInfo = remoteIp ?? "Bilinmiyor";
                    }

                    // --- 2. Kullanıcı Adı Alma ---
                    // Önce Session'a bakıyoruz (eski yapı uyumluluğu için)
                    try
                    {
                        // Not: Session middleware'inin Program.cs'de ekli olması gerekir.
                        var sessionUser = context.Session.GetString("SYS_UserName");
                        if (!string.IsNullOrEmpty(sessionUser))
                        {
                            userName = sessionUser;
                        }
                    }
                    catch
                    {
                        // Session kurulu değilse veya hata verirse geç
                    }

                    // Eğer Session boşsa ve Token (JWT) kullanılıyorsa Identity'den al
                    if (userName == "Anonim" && context.User?.Identity?.IsAuthenticated == true)
                    {
                        userName = context.User.Identity.Name ?? "Anonim";
                    }
                }

                // --- 3. Veritabanına Kayıt ---
                Log log = new Log()
                {
                    LogDate = DateTime.Now,
                    LogDescription = actionToSave,
                    LogIp = ipInfo,
                    LogUser = userName
                };

                _context.Logs.Add(log);
                _context.SaveChanges();
            }
            catch (Exception)
            {
                // Loglama hatası sistemi durdurmamalı
            }
        }

        public List<Log> GetAllLogs()
        {
            // Context inject edildiği için 'using' bloğuna gerek yok
            return _context.Logs.OrderByDescending(l => l.Id).ToList();
        }

        public bool NoAccess()
        {
            // İsteğiniz üzerine IP kısıtlaması kaldırıldı.
            // Her zaman false (Erişim Var) döner.
            return false;
        }
    }
}
