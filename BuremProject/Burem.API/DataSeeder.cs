using Burem.API.Helpers;
using Burem.Data.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Burem.API
{
    public static class DataSeeder
    {
        public static async Task SeedAsync(BuremDbContext context)
        {
            // 1. Veritabanını oluştur (yoksa)
            await context.Database.EnsureCreatedAsync();

            // --- KRİTİK ADIM 0: ROLLERİN EKLENMESİ ---
            // Kullanıcıları eklemeden önce Roller tabloda olmalı, yoksa FK hatası verir.
            if (!await context.Roles.AnyAsync())
            {
                Console.WriteLine("--- Roller Ekleniyor ---");
                var roles = new List<Role>
                {
                    new Role { Id = (int)UserRole.Admin, RoleName = "Admin" },
                    new Role { Id = (int)UserRole.Sekreter, RoleName = "Sekreter" },
                    new Role { Id = (int)UserRole.Ogrenci, RoleName = "Öğrenci" },
                    new Role { Id = (int)UserRole.Terapist, RoleName = "Terapist" }
                };
                await context.Roles.AddRangeAsync(roles);
                await context.SaveChangesAsync();
            }

            // KONTROL: Eğer veritabanında kullanıcı varsa tekrar ekleme yapma.
            if (await context.Users.AnyAsync())
            {
                return;
            }

            Console.WriteLine("--- Kullanıcı Verileri Tohumlanıyor ---");

            var users = new List<User>();

            // --- 1. SİSTEM KULLANICISI (Atanmamış Başvurular İçin) ---
            var unassignedAdvisor = CreateUser("Sistem", "Atanmamış", "system_unassigned", UserRole.Admin);
            users.Add(unassignedAdvisor);

            // --- 2. ADMİNLER ---
            users.Add(CreateUser("Yazılım", "Admin", "admin1", UserRole.Admin));
            users.Add(CreateUser("Bürem", "Yönetici", "admin2", UserRole.Admin));

            // --- 3. SEKRETERLER ---
            users.Add(CreateUser("Ayşe", "Yılmaz (Sekreter)", "sekreter1", UserRole.Sekreter));
            users.Add(CreateUser("Fatma", "Demir (Sekreter)", "sekreter2", UserRole.Sekreter));
            users.Add(CreateUser("Mehmet", "Kaya (Sekreter)", "sekreter3", UserRole.Sekreter));

            // --- 4. TERAPİSTLER ---
            var therapists = new List<User>
            {
                CreateUser("Dr. Ahmet", "Yıldız", "terapist1", UserRole.Terapist),
                CreateUser("Uzm. Psk. Elif", "Kara", "terapist2", UserRole.Terapist),
                CreateUser("Psk. Can", "Öz", "terapist3", UserRole.Terapist),
                CreateUser("Prof. Dr. Selin", "Aksoy", "terapist4", UserRole.Terapist),
                CreateUser("Doç. Dr. Murat", "Çelik", "terapist5", UserRole.Terapist),
                CreateUser("Uzm. Psk. Leyla", "Güneş", "terapist6", UserRole.Terapist),
                CreateUser("Psk. Zeynep", "Su", "terapist7", UserRole.Terapist),
                CreateUser("Psk. Kerem", "Dağ", "terapist8", UserRole.Terapist),
                CreateUser("Psk. Burcu", "Ersoy", "terapist9", UserRole.Terapist),
                CreateUser("Psk. Ozan", "Tekin", "terapist10", UserRole.Terapist)
            };
            users.AddRange(therapists);

            // Kullanıcıları kaydet (ID'ler oluşsun)
            await context.Users.AddRangeAsync(users);
            await context.SaveChangesAsync();

            // Sistem kullanıcısının ID'sini al
            int unassignedId = unassignedAdvisor.Id;

            // --- 5. ÖĞRENCİLER VE BAŞVURULAR ---
            for (int i = 1; i <= 10; i++)
            {
                string ogrenciNo = $"2024{i:0000}";
                string ad = $"ÖğrenciAd{i}";
                string soyad = $"ÖğrenciSoyad{i}";
                string email = $"ogrenci{i}@bogazici.edu.tr";

                // 5.1 Öğrenci User Kaydı
                var studentUser = CreateUser(ad, soyad, ogrenciNo, UserRole.Ogrenci);
                context.Users.Add(studentUser);
                await context.SaveChangesAsync(); // User ID oluşsun

                // 5.2 Öğrenci Profil Kaydı
                var studentProfile = new Student
                {
                    // User tablosuyla ilişki kurmak isterseniz buraya UserId eklenebilir
                    // Şimdilik StudentNo üzerinden eşleşiyor varsayıyoruz.
                    StudentNo = ogrenciNo,
                    FirstName = ad,
                    LastName = soyad,
                    Email = email,
                    Faculty = i % 2 == 0 ? "Eğitim Fakültesi" : "Fen Edebiyat Fakültesi",
                    Department = i % 2 == 0 ? "Rehberlik ve Psikolojik Danışmanlık" : "Psikoloji",
                    Gpa = 3.00 + (i * 0.05),
                    MobilePhone = "05551112233",
                    Gender = i % 2 == 0 ? 1 : 2,
                    Semester = i,
                    BirthDate = 2000 + i,
                    CreatedDate = DateTime.Now.AddDays(-i),
                    IsScholar = i % 3 == 0 ? "Evet" : "Hayır",
                    IsWorking = "Hayır"
                };
                context.Students.Add(studentProfile);
                await context.SaveChangesAsync(); // Student ID oluşsun

                // 5.3 BAŞVURU (SESSION) KAYDI
                var session = new Session
                {
                    StudentId = studentProfile.Id,
                    SessionDate = DateTime.Now.AddDays(-i),
                    AdvisorId = unassignedId, // Sistem kullanıcısına ata
                    SessionNumber = 1,
                    Status = "Atama Bekliyor",
                    RiskLevel = "Düşük",
                    IsOnline = i % 2 == 0,
                    IsArchived = false
                };
                context.Sessions.Add(session);
                // 5.4 Randevu Ekleme (Opsiyonel - Test İçin)
                // Her 2 öğrenciden birine rastgele bir randevu atayalım
                if (i % 2 == 0)
                {
                    var appointment = new Appointment
                    {
                        Session = session, // ID yerine nesne üzerinden bağlayabiliriz
                        TherapistId = therapists[0].Id, // İlk terapiste ata
                        UserId = studentUser.Id, // --- YENİ EKLENEN KISIM (Randevu kime?) ---
                        AppointmentDate = DateTime.Now.AddDays(i + 1),
                        AppointmentType = "Yüz Yüze",
                        LocationOrLink = "Oda 101",
                        CreatedAt = DateTime.Now
                    };
                    context.Appointments.Add(appointment);
                }
            }

            await context.SaveChangesAsync();
            Console.WriteLine("--- Veri Tohumlama Tamamlandı ---");
        }

        // Helper Metodu Güncelledik: Role sınıfı yerine UserRole Enum alıyor
        private static User CreateUser(string firstName, string lastName, string userName, UserRole role)
        {
            return new User
            {
                FirstName = CryptoHelper.Encrypt(firstName),
                LastName = CryptoHelper.Encrypt(lastName),
                UserName = userName,
                UserType = (int)role, // Enum'ı int'e çevirip veritabanına atıyoruz
                Status = 1,
                IsDeleted = 0
            };
        }
    }
}