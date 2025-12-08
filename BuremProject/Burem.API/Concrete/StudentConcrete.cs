using Burem.API.Abstract;
using Burem.API.DTOs;
using Burem.API.Helpers;
using Burem.Data.Models;
using DocumentFormat.OpenXml.InkML;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Burem.API.Concrete
{
    public class StudentConcrete : IStudentService
    {
        private readonly BuremDbContext _context;
        private readonly IConfiguration _configuration;

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

        public StudentConcrete(BuremDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
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

        // Mevcut StudentConcrete sınıfının içine şu metodu ekleyin:
        public async Task<ServiceResult> ApplyStudentAsync(StudentApplicationDto dto)
        {
            using (var transaction = _context.Database.BeginTransaction())
            {
                try
                {
                    // 1. ÖĞRENCİ İŞLEMLERİ
                    var student = await _context.Students.FirstOrDefaultAsync(s => s.StudentNo == dto.StudentNo);
                    bool isNewStudent = false;

                    if (student == null)
                    {
                        isNewStudent = true;
                        student = new Student
                        {
                            StudentNo = dto.StudentNo,
                            CreatedDate = DateTime.Now
                        };
                        _context.Students.Add(student);
                    }

                    // Profil bilgilerini güncelle (Eksik alanlara default değer atandı)
                    student.FirstName = dto.FirstName;
                    student.LastName = dto.LastName;
                    student.MobilePhone = dto.Mobile;
                    student.Email = dto.Email;
                    student.BirthDate = int.TryParse(dto.BirthYear, out int by) ? by : 0;

                    // Nullable olmayan zorunlu alanlar için varsayılan değerler
                    student.Gender = 0; // Veya dto.Gender (int'e çevirip)
                    student.BirthPlace = "99";
                    student.MaritalStatus = "99";

                    // Eğer öğrenci yeniyse ID'sinin oluşması için ÖNCE KAYDETMEMİZ lazım.
                    // Çünkü Answer tablosuna StudentID yazacağız.
                    await _context.SaveChangesAsync();

                    // 2. SEANS OLUŞTURMA
                    var session = new Session
                    {
                        StudentId = student.Id, // Artık student.ID dolu
                        SessionDate = DateTime.Now,
                        IsArchived = false,

                        // --- KRİTİK DÜZELTME 1: AdvisorID ---
                        // Veritabanında AdvisorID zorunluysa geçerli bir ID (örn: 1) vermelisin.
                        // Eğer NULL olabilirse modelini int? yapmalısın. Şimdilik 1 veriyoruz:
                        AdvisorId = 1,

                        // Diğer nullable alanlar
                        DanismanO = null,
                        DanismanG = null
                    };

                    _context.Sessions.Add(session);
                    // SessionID oluşması için tekrar kaydetmek gerekebilir veya 
                    // EF navigation property ile Answer'ı bağlayabilir. Garanti olsun diye kaydedelim:
                    await _context.SaveChangesAsync();

                    // 3. CEVAPLARI KAYDETME
                    if (dto.Answers != null && dto.Answers.Any())
                    {
                        // Soru başlıklarını çek
                        var questionDict = await _context.Questions
                                             .Where(q => q.IsActive)
                                             .ToDictionaryAsync(k => k.Id, v => v.QuestionTitle);

                        foreach (var ans in dto.Answers)
                        {
                            if (!questionDict.ContainsKey(ans.QuestionId)) continue;

                            var answerEntity = new Answer
                            {
                                SessionId = session.Id, // Oluşan Session ID

                                // --- KRİTİK DÜZELTME 2: StudentID ---
                                // Modelinde Answer.Student nesnesi yok, sadece ID alanı var.
                                // O yüzden bunu elle atamak zorundasın.
                                StudentId = student.Id,

                                QuestionId = ans.QuestionId,
                                OptionValue = ans.Value,
                                QuestionTitle = questionDict[ans.QuestionId],
                                AppForm = 1,
                                FeedBackForm = 0
                            };
                            _context.Answers.Add(answerEntity);
                        }
                        await _context.SaveChangesAsync();
                    }

                    transaction.Commit();
                    return ServiceResult.SuccessResult("Başvuru başarıyla alındı.");
                }
                catch (Exception ex)
                {
                    transaction.Rollback();

                    // Hata detayını yakala
                    var msg = ex.Message;
                    if (ex.InnerException != null)
                    {
                        msg += " | Inner: " + ex.InnerException.Message;
                        if (ex.InnerException.InnerException != null)
                            msg += " | Detail: " + ex.InnerException.InnerException.Message;
                    }
                    return ServiceResult.Fail($"Kayıt Hatası: {msg}");
                }
            }
        }
        public async Task<object> GetStudentProfileAsync(int id)
        {
            // 1. ADIM: Öğrenciyi ve Seanslarını çekiyoruz (Advisor JOIN yapmıyoruz!)
            // Böylece danışmanı silinmiş seanslar bile kaybolmaz.
            var s = await _context.Students
                .Include(x => x.Sessions)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (s == null) return null;

            // 2. ADIM: Listelenen seanslardaki AdvisorId'leri topluyoruz
            var advisorIds = s.Sessions.Select(x => x.AdvisorId).Distinct().ToList();

            // 3. ADIM: Bu ID'lere ait kullanıcıları veritabanından ayrıca çekiyoruz
            var advisors = await _context.Users
                .Where(u => advisorIds.Contains(u.Id))
                .Select(u => new { u.Id, u.FirstName, u.LastName }) // Sadece gereken alanlar
                .ToDictionaryAsync(k => k.Id, v => v);

            return new
            {
                id = s.Id,
                studentNo = s.StudentNo,
                firstName = s.FirstName,
                lastName = s.LastName,
                email = s.Email,
                mobilePhone = s.MobilePhone,
                birthYear = (s.BirthDate == 99 || s.BirthDate == null) ? "Cevap Yok" : s.BirthDate.ToString(),
                gender = await GetOptionLabelAsync(s.Gender.ToString(), QID_GENDER),
                lifestyle = await GetOptionLabelAsync(s.Lifestyle, QID_LIFESTYLE),
                birthPlace = await GetOptionLabelAsync(s.BirthPlace, QID_BIRTHPLACE),
                maritalStatus = await GetOptionLabelAsync(s.MaritalStatus, QID_MARITAL_STATUS),
                highSchool = await GetOptionLabelAsync(s.HighSchool, QID_HIGHSCHOOL),
                faculty = await GetOptionLabelAsync(s.Faculty, QID_FACULTY),
                department = await GetOptionLabelAsync(s.Department, QID_DEPARTMENT),
                semester = s.Semester.ToString(),
                academicLevel = await GetOptionLabelAsync(s.AcademicLevel, QID_ACADEMIC_LEVEL),
                preparationLevel = MapStringDictionary(s.PreparationLevel, PreparationMap),
                isScholar = MapDictionary(s.IsScholar, RadioButtonMap),
                contactDegree = s.ContactDegree,
                contactPerson = s.ContactPerson,
                contactPhone = s.ContactPhone,
                currentAdress = s.CurrentAdress,
                isMotherAlive = MapDictionary(s.IsMotherAlive, RadioButtonMap),
                motherAge = s.MotherAge,
                motherProfession = await GetOptionLabelAsync(s.MotherProfession, QID_JOB),
                motherAcademicLevel = await GetOptionLabelAsync(s.MotherAcademicLevel, QID_EDUCATION_LEVEL),
                isFatherAlive = MapDictionary(s.IsDadAlive, RadioButtonMap),
                dadAge = s.DadAge,
                dadProfession = await GetOptionLabelAsync(s.DadProfession, QID_JOB),
                dadAcademicLevel = await GetOptionLabelAsync(s.DadAcademicLevel, QID_EDUCATION_LEVEL),
                parentMarriage = MapDictionary(s.ParentMarriage, ParentMarriageMap),
                brotherSisterTotal = MapDictionary(s.BrotherSisterTotal, RadioButtonMap),
                brotherAmount = s.BrotherAmount,
                sisterAmount = s.SisterAmount,

                // --- Başvuru Geçmişi (GÜVENLİ EŞLEŞTİRME) ---
                sessions = s.Sessions.Select(sess =>
                {
                    // Danışman adını sözlükten buluyoruz
                    string advisorName = "Atanmamış";

                    // Eğer bu ID'ye sahip bir kullanıcı bulunduysa şifresini çözüp yaz
                    if (advisors.TryGetValue(sess.AdvisorId, out var adv))
                    {
                        var fName = CryptoHelper.Decrypt(adv.FirstName);
                        var lName = CryptoHelper.Decrypt(adv.LastName);
                        advisorName = $"{fName} {lName}";
                    }
                    else
                    {
                        // Kullanıcı DB'de bulunamadıysa (Silinmiş vs.)
                        advisorName = "Bilinmiyor";
                    }

                    return new
                    {
                        id = sess.Id,
                        sessionDate = sess.SessionDate.ToString("dd.MM.yyyy"),
                        advisorId = sess.AdvisorId,
                        advisorName = advisorName, // Artık güvenli
                        isArchived = sess.IsArchived ?? false,
                        hasFeedback = false
                    };
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

        // StudentConcrete sınıfının içine ekle:

        public async Task<object> GetSessionDetailAsync(int sessionId)
        {
            // Seansı ve bağlı olduğu öğrenciyi çekiyoruz
            var session = await _context.Sessions
                .Include(s => s.Student) // Öğrenci adını göstermek istersen diye
                .Include(s => s.Advisor)
                .FirstOrDefaultAsync(x => x.Id == sessionId);

            if (session == null) return null;

            // Danışman ismini güvenli bir şekilde oluşturuyoruz
            string advisorNameDisplay = "Atanmamış";
            if (session.Advisor != null)
            {
                // DEĞİŞİKLİK BURADA: İsim ve Soyismi çözüyoruz
                var decryptedFirst = CryptoHelper.Decrypt(session.Advisor.FirstName);
                var decryptedLast = CryptoHelper.Decrypt(session.Advisor.LastName);
                advisorNameDisplay = $"{decryptedFirst} {decryptedLast}";
            }

            // Burada detay sayfasında göstermek istediğin tüm verileri map'le
            return new
            {
                id = session.Id,
                studentId = session.StudentId,
                studentName = session.Student != null ? $"{session.Student.FirstName} {session.Student.LastName}" : "",
                sessionDate = session.SessionDate.ToString("dd.MM.yyyy"),
                advisorId = session.AdvisorId,
                advisorName = advisorNameDisplay,
                isArchived = session.IsArchived ?? false,

                // Eğer veritabanında varsa şu alanları da ekleyebilirsin:
                // notes = session.Notes, 
                // type = session.Type,
                // status = session.Status
            };
        }

        public async Task<ServiceResult<StudentPreFillDto>> GetStudentInfoFromExternalDbAsync(string studentNo)
        {
            try
            {
                var dto = new StudentPreFillDto();
                string connectionString = _configuration.GetConnectionString("StudentConnection");

                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();

                    string sql = @"
                        WITH EnSonDonem AS (
                            SELECT d.ogrencino, d.donem, ROW_NUMBER() OVER(PARTITION BY d.ogrencino ORDER BY d.donem DESC) AS rn
                            FROM ogrencidonembilgileri AS d
                        ),
                        TekKimlik AS (
                            SELECT k.tckimlik, k.dogumtarihi, k.ogrencino, ROW_NUMBER() OVER(PARTITION BY k.tckimlik ORDER BY k.dogumtarihi DESC) AS rn
                            FROM kimlik AS k
                        )
                        SELECT
                            o.ogrencino, o.ad, o.soyad, o.cinsiyet, o.email, o.ceptel, 
                            o.fakulte, 
                            o.bolum, 
                            YEAR(k.dogumtarihi) AS dogum_yil,
                            ods.toplamdonem,
                            CASE 
                                WHEN o.donemdurumu LIKE '%LISANS%' THEN 'LISANS' 
                                WHEN o.ogrencino LIKE '____7%' OR o.donemdurumu LIKE '%MASTER%' THEN 'MASTER' 
                                WHEN o.ogrencino LIKE '____8%' OR o.donemdurumu LIKE '%PHD%' THEN 'PHD' 
                                ELSE o.donemdurumu 
                            END AS hesaplanan_akademik_duzey
                        FROM view_ogrenci_temel_bilgileri_arsivli AS o
                        INNER JOIN TekKimlik AS k ON k.tckimlik = o.tckimlik AND k.rn = 1
                        LEFT JOIN ogrencidonemsayilari ods ON ods.ogrencino = o.ogrencino
                        WHERE o.ogrencino = @p0";

                    using (var command = new SqlCommand(sql, connection))
                    {
                        command.Parameters.Add(new SqlParameter("@p0", studentNo));

                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            if (await reader.ReadAsync())
                            {
                                dto.StudentNo = reader["ogrencino"]?.ToString();
                                dto.FirstName = reader["ad"]?.ToString();
                                dto.LastName = reader["soyad"]?.ToString();
                                dto.Email = reader["email"]?.ToString();
                                dto.MobilePhone = reader["ceptel"]?.ToString();
                                dto.BirthYear = reader["dogum_yil"]?.ToString();
                                dto.Semester = reader["toplamdonem"]?.ToString();

                                string rawGender = reader["cinsiyet"]?.ToString()?.Trim();
                                dto.Gender = rawGender == "K" ? "Kadin" : (rawGender == "E" ? "Erkek" : "");

                                dto.Faculty = reader["fakulte"]?.ToString();
                                dto.Department = reader["bolum"]?.ToString();

                                string rawLevel = reader["hesaplanan_akademik_duzey"]?.ToString()?.ToUpperInvariant() ?? "";
                                if (rawLevel.StartsWith("OZEL")) rawLevel = rawLevel.Replace("OZEL", "");

                                if (rawLevel.Contains("LISANS")) dto.AcademicLevel = "Lisans";
                                else if (rawLevel.Contains("MASTER") || rawLevel.Contains("YUKSEK")) dto.AcademicLevel = "Yüksek Lisans";
                                else if (rawLevel.Contains("PHD") || rawLevel.Contains("DOKTORA")) dto.AcademicLevel = "Doktora";
                                else dto.AcademicLevel = "";

                                // GÜNCELLEME: Burada 'Success' yerine 'SuccessResult' kullanıyoruz
                                return ServiceResult<StudentPreFillDto>.SuccessResult(dto);
                            }
                        }
                    }
                }

                // GÜNCELLEME: Burada 'Failure' yerine 'Fail' kullanıyoruz
                return ServiceResult<StudentPreFillDto>.Fail("Öğrenci bilgisi bulunamadı.");
            }
            catch (Exception ex)
            {
                // GÜNCELLEME: Burada 'Failure' yerine 'Fail' kullanıyoruz
                return ServiceResult<StudentPreFillDto>.Fail($"Veri çekme hatası: {ex.Message}");
            }
        }
    }

}
