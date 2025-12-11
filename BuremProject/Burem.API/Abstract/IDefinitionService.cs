using Burem.API.DTOs;
using Burem.Data.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Burem.API.Abstract
{
    public interface IDefinitionService
    {
        // --- KAMPÜS ---
        Task<List<Campus>> GetCampusesAsync();
        Task<ServiceResultDto> AddCampusAsync(CreateDefinitionDto dto);
        Task<ServiceResultDto> UpdateCampusAsync(UpdateDefinitionDto dto);
        Task<ServiceResultDto> DeleteCampusAsync(int id);

        // --- UZMAN TİPİ ---
        Task<List<TherapistType>> GetTherapistTypesAsync();
        Task<ServiceResultDto> AddTherapistTypeAsync(CreateDefinitionDto dto);
        Task<ServiceResultDto> UpdateTherapistTypeAsync(UpdateDefinitionDto dto);
        Task<ServiceResultDto> DeleteTherapistTypeAsync(int id);

        // --- ROL ---
        Task<List<Role>> GetRolesAsync();
        Task<ServiceResultDto> AddRoleAsync(CreateDefinitionDto dto);
        Task<ServiceResultDto> UpdateRoleAsync(UpdateDefinitionDto dto);
        Task<ServiceResultDto> DeleteRoleAsync(int id);

        // --- RESMİ TATİL ---
        Task<List<UniversityCustomHoliday>> GetHolidaysAsync();
        Task<ServiceResultDto> AddHolidayAsync(CreateHolidayDto dto);
        // Tatillerde genelde güncelleme olmaz, silip yenisi eklenir ama yapıyı bozmamak için ekliyorum:
        Task<ServiceResultDto> DeleteHolidayAsync(int id);
    }
}