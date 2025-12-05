using Burem.API.Concrete;
using Burem.API.DTOs;

namespace Burem.API.Abstract
{
    public interface IFormService
    {
        /*
        Task<List<QuestionDto>> GetAppFormQuestionsAsync();
        */
        /// <summary>
        /// Başvuru formundaki soruları ve seçeneklerini getirir.
        /// </summary>
        Task<ServiceResult<List<QuestionDto>>> GetAppFormQuestionsAsync();

        /*
        Task<List<QuestionDto>> GetQuestionsWithOptionsAsync();

       
        Task<List<QuestionDto>> GetAllQuestionsForFormAsync();
        */

        Task<ServiceResultDto> CreateQuestionAsync(QuestionDto dto);
        Task<ServiceResultDto> DeleteQuestionAsync(int id);
    }
}
