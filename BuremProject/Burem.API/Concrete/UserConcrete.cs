using Burem.API.Abstract;
using Burem.API.DTOs;
using Burem.Data;
using Burem.Data.Models;
using Burem.Data.Enums;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Burem.API.Helpers;

namespace Burem.API.Concrete
{
    public class UserConcrete : IUserService
    {
        private readonly BuremDbContext _context;

        public UserConcrete(BuremDbContext context)
        {
            _context = context;
        }

        // READ: Kullanıcıları Listele
        // YARDIMCI METOT: Şifre çözmeyi dener, çözemezse (veri zaten düzse) olduğu gibi döner.
        private string TryDecrypt(string cipherText)
        {
            if (string.IsNullOrEmpty(cipherText)) return cipherText;
            try
            {
                return CryptoHelper.Decrypt(cipherText);
            }
            catch
            {
                // Eğer şifreli değilse veya anahtar uyuşmazsa veriyi olduğu gibi göster
                return cipherText;
            }
        }

        public async Task<List<UserListDto>> GetUserListAsync()
        {
            // 1. Veritabanından verileri ham (şifreli) haliyle çekiyoruz
            // IsDeleted == 0 olanlar (Silinmemişler)
            var users = await _context.Users
                                      .Where(u => u.IsDeleted == 0)
                                      .OrderByDescending(u => u.CreatedAt)
                                      .ToListAsync();

            var roles = await _context.Roles.ToListAsync();
            var dtoList = new List<UserListDto>();

            // 2. Döngü içinde verileri çözüyoruz (Decrypt)
            foreach (var user in users)
            {
                var roleName = roles.FirstOrDefault(r => r.Id == user.RoleId)?.RoleName ?? "Tanımsız";

                // Şifreli verileri çözüyoruz
                string plainFirstName = TryDecrypt(user.FirstName);
                string plainLastName = TryDecrypt(user.LastName);
                string plainEmail = TryDecrypt(user.Email);
                string plainUserName = TryDecrypt(user.UserName);
                // Not: UserName genelde şifrelenmez ama projenizde şifreliyse burayı da açın.

                dtoList.Add(new UserListDto
                {
                    Id = user.Id,
                    FirstName = plainFirstName, // Çözülmüş veri
                    LastName = plainLastName,   // Çözülmüş veri
                    Email = plainEmail,         // Çözülmüş veri
                    UserName = user.UserName,   // Kullanıcı adını genelde açık tutarız ama şifreliyse 'plainUserName' kullanın

                    UserType = roleName,        // ROL bilgisi eklendi
                    IsActive = user.IsDeleted == 0
                });
            }

            return dtoList;
        }

        // CREATE
        public async Task<ServiceResult> CreateUserAsync(UserCreateDto dto)
        {
            try
            {
                if (await _context.Users.AnyAsync(u => u.UserName == dto.UserName || u.Email == dto.Email))
                {
                    return ServiceResult.Failure("Bu kullanıcı adı veya e-posta zaten kayıtlı.");
                }

                TherapistCategory? catEnum = null;
                if (!string.IsNullOrEmpty(dto.TherapistCategory))
                {
                    if (Enum.TryParse<TherapistCategory>(dto.TherapistCategory, out var parsed))
                    {
                        catEnum = parsed;
                    }
                }

                var role = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == dto.UserType);
                int roleId = role?.Id ?? 3;

                var newUser = new User
                {
                    UserName = dto.UserName,
                    Email = dto.Email,
                    FirstName = dto.FirstName,
                    LastName = dto.LastName,
                    RoleId = roleId,
                    TherapistCategory = catEnum?.ToString(), // Null kontrolü ile stringe çevir

                    // DÜZELTME: Eğer kullanıcı Aktif ise (true), Silinmiş (IsDeleted) 0 olmalı.
                    // Eğer kullanıcı Pasif ise (false), Silinmiş 1 olmalı.
                    IsDeleted = dto.IsActive ? 0 : 1,

                    CreatedAt = DateTime.Now,
                    Password = CryptoHelper.Encrypt(dto.Password),
                    Status = 1 // Varsayılan olarak Status'u da 1 (Aktif) yapabiliriz veritabanı yapınıza göre
                };

                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();

                return ServiceResult.SuccessResult($"'{dto.UserName}' kullanıcısı başarıyla oluşturuldu.");
            }
            catch (Exception ex)
            {
                return ServiceResult.Failure("Hata: " + ex.Message);
            }
        }

        // UPDATE
        public async Task<ServiceResult> UpdateUserAsync(UserUpdateDto dto)
        {
            try
            {
                var user = await _context.Users.FindAsync(dto.Id);
                if (user == null)
                {
                    return ServiceResult.Failure("Kullanıcı bulunamadı.");
                }

                TherapistCategory? catEnum = null;
                if (!string.IsNullOrEmpty(dto.TherapistCategory))
                {
                    if (Enum.TryParse<TherapistCategory>(dto.TherapistCategory, out var parsed))
                    {
                        catEnum = parsed;
                    }
                }

                var role = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == dto.UserType);
                if (role != null)
                {
                    user.RoleId = role.Id;
                }

                user.UserName = dto.UserName;
                user.Email = dto.Email;
                user.FirstName = dto.FirstName;
                user.LastName = dto.LastName;
                user.TherapistCategory = catEnum?.ToString();

                // DÜZELTME: Int <-> Bool dönüşümü
                // IsActive True ise -> IsDeleted = 0
                // IsActive False ise -> IsDeleted = 1
                user.IsDeleted = dto.IsActive ? 0 : 1;

                if (!string.IsNullOrEmpty(dto.NewPassword))
                {
                    user.Password = CryptoHelper.Encrypt(dto.NewPassword);
                }

                await _context.SaveChangesAsync();
                return ServiceResult.SuccessResult("Kullanıcı güncellendi.");
            }
            catch (Exception ex)
            {
                return ServiceResult.Failure("Hata: " + ex.Message);
            }
        }

        // DELETE (PASİFLEŞTİRME)
        public async Task<ServiceResult> DeleteUserAsync(int userId)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return ServiceResult.Failure("Kullanıcı bulunamadı.");
                }

                // DÜZELTME: IsDeleted bir int olduğu için 'true' yerine '1' atıyoruz.
                // 1 = Silinmiş/Pasif
                user.IsDeleted = 1;

                await _context.SaveChangesAsync();

                return ServiceResult.SuccessResult("Kullanıcı silindi (pasif yapıldı).");
            }
            catch (Exception ex)
            {
                return ServiceResult.Failure("Hata: " + ex.Message);
            }
        }
    }
}