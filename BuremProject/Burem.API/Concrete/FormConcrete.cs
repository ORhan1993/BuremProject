using Burem.API.Abstract;
using Burem.API.DTOs;
using Burem.Data.Enums;
using Burem.Data.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Burem.API.Concrete
{
    public class FormConcrete : IFormService
    {
        private readonly BuremDbContext _context;

        public FormConcrete(BuremDbContext context)
        {
            _context = context;
        }
        /*
        // 1. SORULARI GETİRME
        public async Task<List<QuestionDto>> GetAppFormQuestionsAsync()
        {
            var questions = await _context.Questions
                .Include(q => q.Options)
                .Where(q => q.AppForm == 1 && q.IsActive == true)
                .ToListAsync(); // Veriyi önce belleğe çekiyoruz

            // Bellekte güvenli dönüşüm (Mapping)
            return questions
                .OrderBy(q => q.QuestionGroup.GetValueOrDefault(99))
                .ThenBy(q => q.DisplayOrderNo)
                .Select(q => new QuestionDto
                {
                    ID = q.Id,
                    QuestionTitle = q.QuestionTitleForStudents ?? q.QuestionTitle,
                    QuestionType = q.QuestionType,

                    // Entity -> DTO Eşleşmesi
                    QuestionGroup = q.QuestionGroup,
                    SortOrder = q.SortOrder,

                    Options = q.Options
                        .OrderBy(o => o.SortOrder)
                        .Select(o => new OptionDto
                        {
                            ID = o.Id,
                            OptionTitle = o.OptionTitle,
                            OptionValue = o.OptionValue,
                            SortOrder = o.SortOrder
                        }).ToList()
                }).ToList();
        }
        */
        public async Task<ServiceResult<List<QuestionDto>>> GetAppFormQuestionsAsync()
        {
            try
            {
                // 1. Veritabanından Veriyi Çek (Include ile seçenekleri de alıyoruz)
                var questions = await _context.Questions
                    .Include(q => q.Options)
                    .Where(q => q.IsActive && q.AppForm == 1)
                    .OrderBy(q => q.QuestionGroup)
                    .ThenBy(q => q.SortOrder)
                    .AsNoTracking()
                    .ToListAsync();

                if (questions == null || !questions.Any())
                {
                    return ServiceResult<List<QuestionDto>>.Fail("Gösterilecek soru bulunamadı.", 404);
                }

                // --- REFERANS SÖZLÜĞÜ ---
                // Tüm soruları ID'sine göre sözlüğe alıyoruz.
                var optionsLookup = questions.ToDictionary(k => k.Id, v => v.Options);

                // 2. Mapping
                var questionDtos = questions.Select(q =>
                {
                    // A. SEÇENEK BELİRLEME MANTIĞI (DÜZELTİLDİ)
                    var sourceOptions = q.Options;

                    // HATA DÜZELTMESİ BURADA YAPILDI:
                    // q.SameOptionsWith 'int' olduğu için .HasValue veya .Value kullanılmaz.
                    // Bunun yerine 0'dan büyük mü diye bakıyoruz.
                    if ((sourceOptions == null || !sourceOptions.Any()) && q.SameOptionsWith > 0)
                    {
                        // Yine .Value kaldırıldı, doğrudan kendisini kullanıyoruz.
                        if (optionsLookup.ContainsKey(q.SameOptionsWith))
                        {
                            sourceOptions = optionsLookup[q.SameOptionsWith];
                        }
                    }

                    // B. DTO Oluşturma
                    var optionsDto = sourceOptions?
                        .OrderBy(o => o.SortOrder)
                        .Select(o => new OptionDto
                        {
                            ID = o.Id,
                            OptionTitle = !string.IsNullOrEmpty(o.OptionTitleStudent) ? o.OptionTitleStudent : o.OptionTitle,
                            OptionValue = o.OptionValue,
                            SortOrder = o.SortOrder
                        }).ToList() ?? new List<OptionDto>();

                    // C. TIP DÜZELTME
                    int finalType = q.QuestionType;

                    // Eğer seçenek var ama tip metin(1) veya tanımsız(0) kalmışsa -> Radio(2) yap
                    if (optionsDto.Count > 0 && finalType == 0)
                    {
                        finalType = 1;
                    }

                    return new QuestionDto
                    {
                        ID = q.Id,
                        QuestionTitle = !string.IsNullOrEmpty(q.QuestionTitleForStudents) ? q.QuestionTitleForStudents : q.QuestionTitle,
                        QuestionType = finalType,
                        QuestionGroup = q.QuestionGroup,
                        SortOrder = q.SortOrder ?? 0,
                        AppForm = q.AppForm,
                        Options = optionsDto
                    };
                }).ToList();

                return ServiceResult<List<QuestionDto>>.SuccessResult(questionDtos);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<QuestionDto>>.Fail($"Sorular yüklenirken hata oluştu: {ex.Message}", 500);
            }
        }

        // 2. SORU OLUŞTURMA (Düzeltilmiş Metot)
        public async Task<ServiceResultDto> CreateQuestionAsync(QuestionDto dto)
        {
            try
            {
                var newQuestion = new Question
                {
                    QuestionTitle = dto.QuestionTitle,
                    QuestionType = dto.QuestionType,

                    // DTO'daki 'QuestionGroupId' -> Entity'deki 'QuestionGroup'
                    QuestionGroup = dto.QuestionGroup,

                    // '??' hatasını önlemek için GetValueOrDefault kullanımı
                    SortOrder = dto.SortOrder.GetValueOrDefault(0),

                    // Byte dönüşümü
                    DisplayOrderNo = (byte)dto.SortOrder.GetValueOrDefault(1),

                    IsActive = true,
                    AppForm = 1,
                    FeedBackForm = 0,
                    IsProfileQuestion = 0,
                    CanStudentAnswer = 1,
                    QuestionTitleForStudents = dto.QuestionTitle,
                    SameOptionsWith = 0,

                    // Seçenekleri Dönüştür
                    Options = dto.Options?.Select(o => new Option
                    {
                        OptionTitle = o.OptionTitle,
                        OptionValue = o.OptionValue,
                        // Seçenek sırası zorunlu (int) olduğu için varsayılan değer
                        SortOrder = o.SortOrder.GetValueOrDefault(0)
                    }).ToList() ?? new List<Option>()
                };

                _context.Questions.Add(newQuestion);
                await _context.SaveChangesAsync();

                return new ServiceResultDto { IsSuccess = true, Message = "Soru başarıyla oluşturuldu.", Data = newQuestion.Id };
            }
            catch (Exception ex)
            {
                return new ServiceResultDto { IsSuccess = false, Message = $"Hata: {ex.Message}" };
            }
        }

        // 3. SORU SİLME
        public async Task<ServiceResultDto> DeleteQuestionAsync(int id)
        {
            try
            {
                var question = await _context.Questions
                    .Include(q => q.Options)
                    .FirstOrDefaultAsync(q => q.Id == id);

                if (question == null)
                    return new ServiceResultDto { IsSuccess = false, Message = "Soru bulunamadı." };

                if (question.Options != null && question.Options.Any())
                {
                    _context.Options.RemoveRange(question.Options);
                }

                _context.Questions.Remove(question);
                await _context.SaveChangesAsync();

                return new ServiceResultDto { IsSuccess = true, Message = "Soru ve seçenekleri silindi." };
            }
            catch (Exception ex)
            {
                return new ServiceResultDto { IsSuccess = false, Message = $"Silme hatası: {ex.InnerException?.Message ?? ex.Message}" };
            }
        }

        public async Task<List<Question>> GetQuestionsWithOptionsAsync()
        {
            // Clean Code Notu: AsNoTracking() sadece okuma yapılan yerde performans artırır.
            // Include ile seçenekleri (Options) de çekiyoruz.
            return await _context.Questions
                                 .Include(q => q.Options)
                                 .Where(q => !q.IsActive) // Eğer silinenleri gizliyorsan
                                 .OrderBy(q => q.SortOrder)
                                 .AsNoTracking()
                                 .ToListAsync();
        }


    }
}