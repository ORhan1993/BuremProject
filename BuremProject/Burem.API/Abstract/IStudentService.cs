using Burem.API.Concrete;
using Burem.API.Controllers; // SearchCriteriaDto için (veya DTO namespace'i)
using Burem.API.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Burem.API.Abstract
{
    public interface IStudentService
    {
        // Tek bir öğrencinin detayını (Mapping yapılmış halde) getirir
        Task<object> GetStudentProfileAsync(int id);

        // Arama kriterlerine göre öğrenci listesi getirir
        Task<List<object>> SearchStudentsAsync(SearchCriteriaDto criteria);

        Task<object> GetSessionDetailAsync(int sessionId);

        Task<ServiceResult> ApplyStudentAsync(StudentApplicationDto dto);

        Task<ServiceResult<StudentPreFillDto>> GetStudentInfoFromExternalDbAsync(string studentNo);
    }
}