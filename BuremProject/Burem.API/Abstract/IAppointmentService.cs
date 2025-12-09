using Burem.API.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Burem.API.Abstract
{
    public interface IAppointmentService
    {
        // Müsait saatleri getirir
        Task<List<int>> GetAvailableHoursAsync(int therapistId, DateTime date);

        // Müsait terapistleri listeler
        Task<List<TherapistAvailabilityDto>> GetAvailableTherapistsAsync(string category);

        // Randevu oluşturur
        Task<ServiceResultDto> CreateAppointmentAsync(CreateAppointmentDto dto);

        // --- EKSİK OLAN METOTLAR ---

        // Durum güncelleme (İptal/Tamamlandı)
        Task<ServiceResultDto> UpdateStatusAsync(UpdateAppointmentStatusDto model);

        // Terapist takvimi
        Task<List<TherapistDashboardDto>> GetTherapistScheduleAsync(int therapistId);

        // Tüm randevular
        Task<List<AppointmentDetailDto>> GetAllAppointmentsAsync();

        // Tatil kontrolü (Bunu Interface'e eklediysen Concrete'de public olmalı)
        Task<bool> IsHolidayAsync(DateTime date);
        // Özel tatil ekleme
        Task<ServiceResultDto> AddCustomHolidayAsync(AddHolidayDto dto);
    }
}