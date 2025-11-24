using Burem.API.Abstract;
using Burem.API.DTOs;
using Burem.Data.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;

namespace Burem.API.Concrete
{
    public class StudentConcrete : IStudentService
    {
        private readonly BuremDbContext _context;

        // ========================================================================
        // 1. SORU ID'LERİ (Eski Projenizle Birebir Eşleşen Liste)
        // ========================================================================
        private const int QID_BIRTHPLACE = 175;     // Doğum Yeri
        private const int QID_GENDER = 176;         // Cinsiyet (DB'den de çekilebilir)
        private const int QID_MARITAL_STATUS = 177; // Medeni Hal
        private const int QID_LIFESTYLE = 178;      // Yaşama Biçimi
        private const int QID_FACULTY = 179;        // Fakülte
        private const int QID_ACADEMIC_LEVEL = 180; // Akademik Düzey
        private const int QID_EDUCATION_LEVEL = 181;// Anne/Baba Eğitim Düzeyi
        private const int QID_ADRESS = 182;         // Adres (İl/İlçe) - Gerekirse
        private const int QID_JOB = 183;            // Meslekler (Anne/Baba) <-- EKLENDİ
        private const int QID_HIGHSCHOOL = 184;     // Lise
        private const int QID_DEPARTMENT = 185;     // Bölüm

        // ========================================================================
        // 2. STATİK MAPPING LISTELERİ (Kod İçinde Tanımlı Olanlar)
        // ========================================================================

        private readonly Dictionary<int, string> RadioButtonMap = new Dictionary<int, string>
        {
            { 99, "Cevap Yok" }, { 1, "Evet" }, { 2, "Hayır" }
        };

        private readonly Dictionary<int, string> ParentMarriageMap = new Dictionary<int, string>
        {
            { 99, "Cevap Yok" }, { 1, "Birlikte" }, { 2, "Birlikte Değiller" }
        };

        // Hazırlık Seviyeleri (Eski projede getPreparationLevel metodundan alındı)
        private readonly Dictionary<string, string> PreparationMap = new Dictionary<string, string>
        {
            { "1", "P1" }, { "2", "P2" }, { "3", "P3" }, { "4", "P4" }, { "99", "Cevap Yok" }
        };

        public StudentConcrete(BuremDbContext context)
        {
            _context = context;
        }

        // ========================================================================
        // 3. YARDIMCI METOTLAR
        // ========================================================================

        // Veritabanı 'Options' tablosundan ID karşılığını bulur
        private async Task<string> GetOptionLabelAsync(string value, int questionId)
        {
            if (string.IsNullOrEmpty(value) || value == "99") return "Cevap Yok";

            // Veritabanını yormamak için önce ID değilse direkt döndürebiliriz
            // Ancak bazen metin de olsa DB'de karşılığı olabilir, o yüzden sorguluyoruz.

            var title = await _context.Options
                .Where(o => o.QuestionId == questionId && o.OptionValue == value)
                .Select(o => o.OptionTitle)
                .FirstOrDefaultAsync();

            return title ?? value; // Bulamazsa ham değeri göster (Örn: elle girilmiş metin)
        }

        // Sözlükten (Dictionary) değer bulur
        private string MapDictionary(string val, Dictionary<int, string> map)
        {
            if (int.TryParse(val, out int key) && map.ContainsKey(key)) return map[key];
            return "Cevap Yok";
        }

        // String key'li sözlükler için (Hazırlık sınıfı gibi)
        private string MapStringDictionary(string val, Dictionary<string, string> map)
        {
            if (!string.IsNullOrEmpty(val) && map.ContainsKey(val)) return map[val];
            return val;
        }

        // ========================================================================
        // 4. IStudentService UYGULAMASI
        // ========================================================================

        public async Task<object> GetStudentProfileAsync(int id)
        {
            var s = await _context.Students
                .Include(x => x.Sessions)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (s == null) return null;

            return new
            {
                // --- Temel Bilgiler ---
                id = s.Id,
                studentNo = s.StudentNo,
                firstName = s.FirstName,
                lastName = s.LastName,
                email = s.Email,
                mobilePhone = s.MobilePhone,
                birthYear = (s.BirthDate == 99 || s.BirthDate == null) ? "Cevap Yok" : s.BirthDate.ToString(),

                // --- Kişisel Bilgiler (Mapping) ---
                gender = await GetOptionLabelAsync(s.Gender.ToString(), QID_GENDER), // ID: 176
                lifestyle = await GetOptionLabelAsync(s.Lifestyle, QID_LIFESTYLE),   // ID: 178
                birthPlace = await GetOptionLabelAsync(s.BirthPlace, QID_BIRTHPLACE),// ID: 175
                maritalStatus = await GetOptionLabelAsync(s.MaritalStatus, QID_MARITAL_STATUS), // ID: 177
                highSchool = await GetOptionLabelAsync(s.HighSchool, QID_HIGHSCHOOL), // ID: 184

                // --- Akademik Bilgiler ---
                faculty = await GetOptionLabelAsync(s.Faculty, QID_FACULTY),         // ID: 179
                department = await GetOptionLabelAsync(s.Department, QID_DEPARTMENT), // ID: 185
                semester = s.Semester.ToString(),
                academicLevel = await GetOptionLabelAsync(s.AcademicLevel, QID_ACADEMIC_LEVEL), // ID: 180

                // <-- EKLENDİ: Hazırlık Seviyesi
                preparationLevel = MapStringDictionary(s.PreparationLevel, PreparationMap),

                isScholar = MapDictionary(s.IsScholar, RadioButtonMap), // Burs

                // --- İletişim ---
                contactDegree = s.ContactDegree,
                contactPerson = s.ContactPerson,
                contactPhone = s.ContactPhone,
                currentAdress = s.CurrentAdress,

                // --- Aile Bilgileri ---
                isMotherAlive = MapDictionary(s.IsMotherAlive, RadioButtonMap),
                motherAge = s.MotherAge,

                // <-- EKLENDİ: Anne Mesleği (ID: 183)
                motherProfession = await GetOptionLabelAsync(s.MotherProfession, QID_JOB),
                motherAcademicLevel = await GetOptionLabelAsync(s.MotherAcademicLevel, QID_EDUCATION_LEVEL), // ID: 181

                isFatherAlive = MapDictionary(s.IsDadAlive, RadioButtonMap),
                dadAge = s.DadAge,

                // <-- EKLENDİ: Baba Mesleği (ID: 183)
                dadProfession = await GetOptionLabelAsync(s.DadProfession, QID_JOB),
                dadAcademicLevel = await GetOptionLabelAsync(s.DadAcademicLevel, QID_EDUCATION_LEVEL), // ID: 181

                parentMarriage = MapDictionary(s.ParentMarriage, ParentMarriageMap),
                brotherSisterTotal = MapDictionary(s.BrotherSisterTotal, RadioButtonMap),
                brotherAmount = s.BrotherAmount,
                sisterAmount = s.SisterAmount,

                // --- Başvuru Geçmişi ---
                sessions = s.Sessions.Select(sess => new
                {
                    id = sess.Id,
                    sessionDate = sess.SessionDate.ToString("dd.MM.yyyy"),
                    advisorId = sess.AdvisorId,
                    isArchived = sess.IsArchived ?? false,
                    hasFeedback = false // İleride eklenebilir
                }).OrderByDescending(x => x.id).ToList()
            };
        }

        // Arama Metodu (Aynı kaldı)
        public async Task<List<object>> SearchStudentsAsync(SearchCriteriaDto criteria)
        {
            var query = _context.Students.Include(s => s.Sessions).AsQueryable();

            if (!string.IsNullOrEmpty(criteria.StudentNo)) query = query.Where(s => s.StudentNo.Contains(criteria.StudentNo));
            if (!string.IsNullOrEmpty(criteria.FirstName)) query = query.Where(s => s.FirstName.Contains(criteria.FirstName));
            if (!string.IsNullOrEmpty(criteria.LastName)) query = query.Where(s => s.LastName.Contains(criteria.LastName));
            // Tarih filtreleri...
            if (!string.IsNullOrEmpty(criteria.SessionDateStart) && DateTime.TryParseExact(criteria.SessionDateStart, "dd.MM.yyyy", null, System.Globalization.DateTimeStyles.None, out DateTime dateStart))
                query = query.Where(s => s.Sessions.Any(sess => sess.SessionDate >= dateStart));
            if (!string.IsNullOrEmpty(criteria.SessionDateFinish) && DateTime.TryParseExact(criteria.SessionDateFinish, "dd.MM.yyyy", null, System.Globalization.DateTimeStyles.None, out DateTime dateEnd))
                query = query.Where(s => s.Sessions.Any(sess => sess.SessionDate <= dateEnd));

            var list = await query.Take(50).ToListAsync();
            var mappedList = new List<object>();

            foreach (var s in list)
            {
                mappedList.Add(new
                {
                    id = s.Id,
                    studentNo = s.StudentNo,
                    firstName = s.FirstName,
                    lastName = s.LastName,
                    faculty = await GetOptionLabelAsync(s.Faculty, QID_FACULTY),
                    department = await GetOptionLabelAsync(s.Department, QID_DEPARTMENT),
                    academicLevel = await GetOptionLabelAsync(s.AcademicLevel, QID_ACADEMIC_LEVEL),
                    sessions = s.Sessions.Select(sess => new { id = sess.Id, sessionDate = sess.SessionDate.ToString("dd.MM.yyyy"), isArchived = sess.IsArchived }).ToList()
                });
            }

            return mappedList;
        }
    }
}