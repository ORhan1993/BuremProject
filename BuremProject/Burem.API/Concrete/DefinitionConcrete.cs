using Burem.API.Abstract;
using Burem.API.DTOs;
using Burem.Data;
using Burem.Data.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq; // OrderBy için gerekli
using System.Threading.Tasks;

namespace Burem.API.Concrete
{
    public class DefinitionConcrete : IDefinitionService
    {
        private readonly BuremDbContext _context;

        public DefinitionConcrete(BuremDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // KAMPÜS İŞLEMLERİ
        // =========================================================
        public async Task<List<Campus>> GetCampusesAsync()
        {
            return await _context.Campuses.OrderBy(x => x.Name).ToListAsync();
        }

        public async Task<ServiceResultDto> AddCampusAsync(CreateDefinitionDto dto)
        {
            if (string.IsNullOrEmpty(dto.Name)) return new ServiceResultDto { IsSuccess = false, Message = "İsim boş olamaz." };

            var campus = new Campus { Name = dto.Name };
            _context.Campuses.Add(campus);
            await _context.SaveChangesAsync();
            return new ServiceResultDto { IsSuccess = true, Message = "Kampüs eklendi." };
        }

        public async Task<ServiceResultDto> UpdateCampusAsync(UpdateDefinitionDto dto)
        {
            var entity = await _context.Campuses.FindAsync(dto.Id);
            if (entity == null) return new ServiceResultDto { IsSuccess = false, Message = "Kayıt bulunamadı." };

            entity.Name = dto.Name;
            await _context.SaveChangesAsync();
            return new ServiceResultDto { IsSuccess = true, Message = "Kampüs güncellendi." };
        }

        public async Task<ServiceResultDto> DeleteCampusAsync(int id)
        {
            var entity = await _context.Campuses.FindAsync(id);
            if (entity == null) return new ServiceResultDto { IsSuccess = false, Message = "Kayıt bulunamadı." };

            // İlişkisel veri kontrolü (Örn: Bu kampüse bağlı terapist var mı?)
            bool isUsed = await _context.Therapists.AnyAsync(t => t.CampusId == id);
            if (isUsed) return new ServiceResultDto { IsSuccess = false, Message = "Bu kampüse bağlı uzmanlar olduğu için silinemez." };

            _context.Campuses.Remove(entity);
            await _context.SaveChangesAsync();
            return new ServiceResultDto { IsSuccess = true, Message = "Kampüs silindi." };
        }

        // =========================================================
        // UZMAN TİPİ İŞLEMLERİ
        // =========================================================
        public async Task<List<TherapistType>> GetTherapistTypesAsync()
        {
            return await _context.TherapistTypes.OrderBy(x => x.Name).ToListAsync();
        }

        public async Task<ServiceResultDto> AddTherapistTypeAsync(CreateDefinitionDto dto)
        {
            if (string.IsNullOrEmpty(dto.Name)) return new ServiceResultDto { IsSuccess = false, Message = "İsim boş olamaz." };

            var type = new TherapistType { Name = dto.Name };
            _context.TherapistTypes.Add(type);
            await _context.SaveChangesAsync();
            return new ServiceResultDto { IsSuccess = true, Message = "Uzman tipi eklendi." };
        }

        public async Task<ServiceResultDto> UpdateTherapistTypeAsync(UpdateDefinitionDto dto)
        {
            var entity = await _context.TherapistTypes.FindAsync(dto.Id);
            if (entity == null) return new ServiceResultDto { IsSuccess = false, Message = "Kayıt bulunamadı." };

            entity.Name = dto.Name;
            await _context.SaveChangesAsync();
            return new ServiceResultDto { IsSuccess = true, Message = "Uzman tipi güncellendi." };
        }

        public async Task<ServiceResultDto> DeleteTherapistTypeAsync(int id)
        {
            var entity = await _context.TherapistTypes.FindAsync(id);
            if (entity == null) return new ServiceResultDto { IsSuccess = false, Message = "Kayıt bulunamadı." };

            bool isUsed = await _context.Therapists.AnyAsync(t => t.TherapistTypeId == id);
            if (isUsed) return new ServiceResultDto { IsSuccess = false, Message = "Bu tipe bağlı uzmanlar olduğu için silinemez." };

            _context.TherapistTypes.Remove(entity);
            await _context.SaveChangesAsync();
            return new ServiceResultDto { IsSuccess = true, Message = "Uzman tipi silindi." };
        }

        // =========================================================
        // ROL İŞLEMLERİ
        // =========================================================
        public async Task<List<Role>> GetRolesAsync()
        {
            return await _context.Roles.OrderBy(r => r.RoleName).ToListAsync();
        }

        public async Task<ServiceResultDto> AddRoleAsync(CreateDefinitionDto dto)
        {
            if (string.IsNullOrEmpty(dto.Name)) return new ServiceResultDto { IsSuccess = false, Message = "Rol adı boş olamaz." };

            // Rol ID'si Identity değilse manuel artırmamız gerekebilir, Identity ise bu satıra gerek yok:
            var lastId = await _context.Roles.MaxAsync(r => (int?)r.Id) ?? 0;

            var role = new Role
            {
                Id = lastId + 1, // Manuel ID atama (Eğer DB Identity değilse)
                RoleName = dto.Name
            };

            _context.Roles.Add(role);
            await _context.SaveChangesAsync();
            return new ServiceResultDto { IsSuccess = true, Message = "Rol eklendi." };
        }

        public async Task<ServiceResultDto> UpdateRoleAsync(UpdateDefinitionDto dto)
        {
            var entity = await _context.Roles.FindAsync(dto.Id);
            if (entity == null) return new ServiceResultDto { IsSuccess = false, Message = "Rol bulunamadı." };

            entity.RoleName = dto.Name;
            await _context.SaveChangesAsync();
            return new ServiceResultDto { IsSuccess = true, Message = "Rol güncellendi." };
        }

        public async Task<ServiceResultDto> DeleteRoleAsync(int id)
        {
            var entity = await _context.Roles.FindAsync(id);
            if (entity == null) return new ServiceResultDto { IsSuccess = false, Message = "Rol bulunamadı." };

            // Sistemdeki kritik rolleri (Admin, Sekreter vb.) silmeyi engellemek iyi bir fikirdir.
            if (id <= 4) return new ServiceResultDto { IsSuccess = false, Message = "Sistem rolleri silinemez." };

            // Kullanıcı kontrolü
            bool isUsed = await _context.Users.AnyAsync(u => u.RoleId == id);
            if (isUsed) return new ServiceResultDto { IsSuccess = false, Message = "Bu role sahip kullanıcılar var, silinemez." };

            _context.Roles.Remove(entity);
            await _context.SaveChangesAsync();
            return new ServiceResultDto { IsSuccess = true, Message = "Rol silindi." };
        }

        // =========================================================
        // RESMİ TATİL İŞLEMLERİ 
        // =========================================================
        public async Task<List<UniversityCustomHoliday>> GetHolidaysAsync()
        {
            // Gelecek tatilleri önce listele
            return await _context.UniversityCustomHolidays
                                 .OrderBy(h => h.HolidayDate)
                                 .ToListAsync();
        }

        public async Task<ServiceResultDto> AddHolidayAsync(CreateHolidayDto dto)
        {
            // 1. Yetki Kontrolü (Sadece Admin(1) ve Sekreter(2))
            if (dto.CurrentUserRoleId != 1 && dto.CurrentUserRoleId != 2)
            {
                return new ServiceResultDto { IsSuccess = false, Message = "Bu işlemi yapmaya yetkiniz yok." };
            }

            // 2. Geçmiş Tarih Kontrolü
            if (dto.Date < DateTime.Today)
            {
                return new ServiceResultDto { IsSuccess = false, Message = "Geçmiş bir tarihe tatil eklenemez." };
            }

            // 3. Mükerrer Kayıt Kontrolü
            bool exists = await _context.UniversityCustomHolidays.AnyAsync(h => h.HolidayDate == dto.Date);
            if (exists)
            {
                return new ServiceResultDto { IsSuccess = false, Message = "Bu tarih zaten tatil olarak eklenmiş." };
            }

            var holiday = new UniversityCustomHoliday
            {
                HolidayDate = dto.Date,
                Description = dto.Description ?? "İdari İzin"
            };

            _context.UniversityCustomHolidays.Add(holiday);
            await _context.SaveChangesAsync();

            return new ServiceResultDto { IsSuccess = true, Message = "Özel tatil eklendi ve sistem kapatıldı." };
        }

        public async Task<ServiceResultDto> DeleteHolidayAsync(int id)
        {
            var entity = await _context.UniversityCustomHolidays.FindAsync(id);
            if (entity == null) return new ServiceResultDto { IsSuccess = false, Message = "Kayıt bulunamadı." };

            _context.UniversityCustomHolidays.Remove(entity);
            await _context.SaveChangesAsync();
            return new ServiceResultDto { IsSuccess = true, Message = "Tatil silindi." };
        }
    }
}