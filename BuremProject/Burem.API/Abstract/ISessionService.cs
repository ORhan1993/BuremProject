using Burem.API.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Burem.API.Abstract
{
    public interface ISessionService
    {
        /// <summary>
        /// Tekil başvuru detayını ve cevapları getirir.
        /// </summary>
        Task<SessionDetailDto> GetSessionDetailAsync(int sessionId);

        /// <summary>
        /// Başvuru formundaki cevapları günceller.
        /// </summary>
        Task<bool> UpdateSessionAnswersAsync(int sessionId, List<UpdateSessionAnswersDto> updatedAnswers);

        // YENİ: Sekreter için bekleyenler
        Task<List<PendingSessionDto>> GetPendingSessionsAsync();
    }
}