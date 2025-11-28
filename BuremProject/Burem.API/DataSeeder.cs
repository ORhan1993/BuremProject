using Burem.API.Helpers;
using Burem.Data.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Burem.API
{
    public static class DataSeeder
    {
        public static async Task SeedAsync(BuremDbContext context)
        {
            // 1. Veritabanını oluştur (yoksa)
            await context.Database.EnsureCreatedAsync();

            // KONTROL: Eğer veritabanında zaten veri varsa ve temiz bir başlangıç istiyorsan,
            // aşağıdaki "return" satırını YORUMA AL veya SİL.
            // Eğer veritabanını silip baştan kurmak istersen Program.cs adımındaki notu oku.
            if (await context.Users.AnyAsync())
            {
                // Veri varsa tekrar ekleme yapmasın diye çıkıyoruz.
                // Eğer verilerin eksik olduğunu düşünüyorsan bu bloğu silmelisin.
                return;
            }

            Console.WriteLine("--- Veri Tohumlama Başladı ---");

            var users = new List<User>();
            var students = new List<Student>();
            var sessions = new List<Session>();
            var answers = new List<Answer>();

            // --- 1. SİSTEM KULLANICISI (Atanmamış Başvurular İçin) ---
            // AdvisorId FK hatası almamak için "Atanmamış" durumunu temsil eden bir kullanıcı
            var unassignedAdvisor = CreateUser("Sistem", "Atanmamış", "system_unassigned", Role.Admin); // Geçici Admin rolü
            users.Add(unassignedAdvisor);

            // --- 2. ADMİNLER (2 Adet) ---
            users.Add(CreateUser("Yazılım", "Admin", "admin1", Role.Admin));
            users.Add(CreateUser("Bürem", "Yönetici", "admin2", Role.Admin));

            // --- 3. SEKRETERLER (3 Adet) ---
            users.Add(CreateUser("Ayşe", "Yılmaz (Sekreter)", "sekreter1", Role.Sekreter));
            users.Add(CreateUser("Fatma", "Demir (Sekreter)", "sekreter2", Role.Sekreter));
            users.Add(CreateUser("Mehmet", "Kaya (Sekreter)", "sekreter3", Role.Sekreter));

            // --- 4. TERAPİSTLER (10 Adet - Gruplara Dağıtılmış) ---
            // Soyadlarına gruplarını ekledik ki panelde ayırt edilebilsin.
            var therapists = new List<User>
            {
                CreateUser("Dr. Ahmet", "Yıldız (BÜREM Uzmanı)", "terapist1", Role.Terapist),
                CreateUser("Uzm. Psk. Elif", "Kara (BÜREM Uzmanı)", "terapist2", Role.Terapist),
                CreateUser("Psk. Can", "Öz (BÜREM Uzmanı)", "terapist3", Role.Terapist),
                CreateUser("Prof. Dr. Selin", "Aksoy (Deneyimli)", "terapist4", Role.Terapist),
                CreateUser("Doç. Dr. Murat", "Çelik (Deneyimli)", "terapist5", Role.Terapist),
                CreateUser("Uzm. Psk. Leyla", "Güneş (Deneyimli)", "terapist6", Role.Terapist),
                CreateUser("Psk. Zeynep", "Su (Gönüllü)", "terapist7", Role.Terapist),
                CreateUser("Psk. Kerem", "Dağ (Gönüllü)", "terapist8", Role.Terapist),
                CreateUser("Psk. Burcu", "Ersoy (İndirimli)", "terapist9", Role.Terapist),
                CreateUser("Psk. Ozan", "Tekin (İndirimli)", "terapist10", Role.Terapist)
            };
            users.AddRange(therapists);

            // Kullanıcıları önce kaydedelim ki ID'leri oluşsun (Session bağlantısı için gerekli)
            await context.Users.AddRangeAsync(users);
            await context.SaveChangesAsync();

            // Eklenen "Atanmamış" kullanıcısının ID'sini al
            int unassignedId = unassignedAdvisor.Id;

            // --- 5. ÖĞRENCİLER VE BAŞVURULAR (10 Adet) ---
            for (int i = 1; i <= 10; i++)
            {
                string ogrenciNo = $"2024{i.ToString("0000")}";
                string ad = $"ÖğrenciAd{i}";
                string soyad = $"ÖğrenciSoyad{i}";
                string email = $"ogrenci{i}@bogazici.edu.tr";

                // 5.1 Öğrenci User Kaydı (Giriş İçin)
                var studentUser = CreateUser(ad, soyad, ogrenciNo, Role.Ogrenci);
                context.Users.Add(studentUser); // Listeye değil direkt context'e ekleyip save edelim
                await context.SaveChangesAsync();

                // 5.2 Öğrenci Profil Kaydı (Detaylar İçin)
                var studentProfile = new Student
                {
                    StudentNo = ogrenciNo,
                    FirstName = ad,
                    LastName = soyad,
                    Email = email,
                    Faculty = i % 2 == 0 ? "Eğitim Fakültesi" : "Fen Edebiyat Fakültesi",
                    Department = i % 2 == 0 ? "Rehberlik ve Psikolojik Danışmanlık" : "Psikoloji",
                    Gpa = 3.00 + (i * 0.05),
                    MobilePhone = "05551112233",
                    Gender = i % 2 == 0 ? 1 : 2, // 1: Kadın, 2: Erkek
                    Semester = i,
                    BirthDate = 2000 + i, // Doğum yılı olarak int tutuluyor
                    CreatedDate = DateTime.Now.AddDays(-i), // Geçmiş tarihler
                    IsScholar = i % 3 == 0 ? "Evet" : "Hayır",
                    IsWorking = "Hayır"
                };
                context.Students.Add(studentProfile);
                await context.SaveChangesAsync(); // ID oluşsun

                // 5.3 BAŞVURU (SESSION) KAYDI - KRİTİK ADIM
                // Eğer bu kayıt olmazsa öğrenci "Yeni Başvurular" listesinde görünmez.
                var session = new Session
                {
                    StudentId = studentProfile.Id,
                    SessionDate = DateTime.Now.AddDays(-i), // Başvuru tarihi
                    AdvisorId = unassignedId, // Henüz atanmamış (Dummy kullanıcı ID'si)
                    SessionNumber = 1, // İlk başvuru
                    Status = "Atama Bekliyor", // Sekreterin göreceği durum
                    RiskLevel = "Düşük",
                    IsOnline = i % 2 == 0, // Bazıları online, bazıları yüz yüze
                    IsArchived = false
                };
                context.Sessions.Add(session);
                await context.SaveChangesAsync(); // Session ID oluşsun

                // 5.4 ÖRNEK CEVAPLAR (Formun dolu görünmesi için)
                // Burada QuestionId'lerin veritabanınızda 1,2,3.. gibi var olduğunu varsayıyoruz.
                // Eğer soru tablosu boşsa, önce soruların eklenmesi gerekir.
                // Şimdilik hata vermemesi için dummy cevap eklemiyoruz veya catch bloğuna alıyoruz.
                // İsterseniz buraya soru ekleme kodu da yazılabilir.
            }

            await context.SaveChangesAsync();
            Console.WriteLine("--- Veri Tohumlama Tamamlandı ---");
        }

        private static User CreateUser(string firstName, string lastName, string userName, Role role)
        {
            return new User
            {
                FirstName = CryptoHelper.Encrypt(firstName),
                LastName = CryptoHelper.Encrypt(lastName),
                UserName = userName,
                UserType = (int)role,
                Status = 1,
                IsDeleted = 0
            };
        }
    }
}