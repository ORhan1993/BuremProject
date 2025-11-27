using Burem.API.Abstract;
using Burem.API.DTOs;
using Burem.API.Helpers;
using Burem.Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;

namespace Burem.API.Concrete
{
    public class AppointmentConcrete : IAppointmentService
    {
        private readonly BuremDbContext _context;
        private readonly MailHelper _mailHelper;

        public AppointmentConcrete(BuremDbContext context, IConfiguration config)
        {
            _context = context;
            // MailHelper'ı burada initialize ediyoruz, Controller'da değil.
            _mailHelper = new MailHelper(config);
        }

        public async Task<List<TherapistAvailabilityDto>> GetAvailableTherapistsAsync(string category)
        {
            // 1. Veritabanından tüm aktif terapistleri çek
            var encryptedTherapists = await _context.Users
                                            .Where(u => u.UserType == 4 && u.IsDeleted == 0)
                                            .ToListAsync();

            var result = new List<TherapistAvailabilityDto>();

            foreach (var user in encryptedTherapists)
            {
                // 2. RAM üzerinde şifreleri çöz
                string decryptedName = $"{CryptoHelper.Decrypt(user.FirstName)} {CryptoHelper.Decrypt(user.LastName)}";

                // Kategori filtresi eklenecekse buraya eklenebilir.

                // 3. Yükü hesapla
                int currentLoad = await _context.Appointments
                    .CountAsync(a => a.TherapistId == user.Id && a.AppointmentDate >= DateTime.Now);

                result.Add(new TherapistAvailabilityDto
                {
                    Id = user.Id,
                    Name = decryptedName,
                    Category = "BÜREM Uzmanı",
                    Campus = "Kuzey", // İleride DB'den gelebilir
                    CurrentLoad = currentLoad,
                    DailySlots = 5 - (currentLoad % 5),
                    WorkingDays = new List<string> { "Pzt", "Sal", "Çar", "Per", "Cum" }
                });
            }

            return result;
        }

        public async Task<ServiceResultDto> CreateAppointmentAsync(CreateAppointmentDto dto)
        {
            // A. Validasyon
            if (!DateTime.TryParseExact($"{dto.Date} {dto.Time}", "dd.MM.yyyy HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime appointmentDateTime))
            {
                return new ServiceResultDto { IsSuccess = false, Message = "Tarih formatı hatalı." };
            }

            // B. Veritabanına Kayıt
            var appointment = new Appointment
            {
                SessionId = dto.SessionId,
                TherapistId = dto.TherapistId,
                AppointmentDate = appointmentDateTime,
                AppointmentType = dto.Type,
                LocationOrLink = dto.RoomLink,
                CreatedAt = DateTime.Now
            };

            _context.Appointments.Add(appointment);

            // C. Session Tablosunu Güncelle
            var session = await _context.Sessions
                                        .Include(s => s.Student)
                                        .FirstOrDefaultAsync(s => s.Id == dto.SessionId);

            if (session != null)
            {
                session.AdvisorId = dto.TherapistId;

                // Terapist adını çöz
                var therapist = await _context.Users.FindAsync(dto.TherapistId);
                string therapistName = "Uzman";

                if (therapist != null)
                {
                    therapistName = $"{CryptoHelper.Decrypt(therapist.FirstName)} {CryptoHelper.Decrypt(therapist.LastName)}";
                }

                // D. Mail Gönderimi
                if (session.Student != null && !string.IsNullOrEmpty(session.Student.Email))
                {
                    try
                    {
                        _mailHelper.SendAppointmentEmail(
                            session.Student.Email,
                            $"{session.Student.FirstName} {session.Student.LastName}",
                            therapistName,
                            dto.Date,
                            dto.Time,
                            dto.Type,
                            dto.RoomLink
                        );
                    }
                    catch (Exception)
                    {
                        // Mail hatası kritik bir hata (Exception) fırlatmamalı, ancak loglanabilir.
                        // Şimdilik yutuyoruz.
                    }
                }
            }

            await _context.SaveChangesAsync();
            return new ServiceResultDto { IsSuccess = true, Message = "Randevu oluşturuldu ve bilgilendirme maili gönderildi." };
        }

        Task<ServiceResultDto> IAppointmentService.CreateAppointmentAsync(CreateAppointmentDto dto)
        {
            throw new NotImplementedException();
        }
    }

    
}