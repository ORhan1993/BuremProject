using Burem.API.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Burem.API.Abstract
{
    public interface IAppointmentService
    {
        // Müsait terapistleri listeleme işlemi
        Task<List<TherapistAvailabilityDto>> GetAvailableTherapistsAsync(string category);

        // Randevu oluşturma işlemi
        Task<ServiceResultDto> CreateAppointmentAsync(CreateAppointmentDto dto);
    }
}