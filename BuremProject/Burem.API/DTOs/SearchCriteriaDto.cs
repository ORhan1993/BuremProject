// Bu sınıfları projenizin DTO klasörüne koymanız önerilir.
public class SearchCriteriaDto
{
    public string? StudentNo { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Gender { get; set; } // "1" veya "2" gibi gelir

    public string? Faculty { get; set; }
    public string? Department { get; set; }
    public string? AcademicLevel { get; set; } // "LISANS", "YUKSEK" vs.

    // Tarih aralıkları (String olarak "dd.MM.yyyy" formatında gelir)
    public string? BirthDateStart { get; set; }
    public string? BirthDateFinish { get; set; }
    public string? SessionDateStart { get; set; }
    public string? SessionDateFinish { get; set; }

    // Sayısal aralıklar
    public decimal? GpaStart { get; set; }
    public decimal? GpaFinish { get; set; }
    public int? SemesterMin { get; set; }

    // Diğer filtreler
    public string? OlcekTipi { get; set; }

    // Form cevaplarına göre arama (Gelişmiş)
    public List<AnswerCriteriaDto>? AnswerList { get; set; }
}

public class AnswerCriteriaDto
{
    public int QuestionID { get; set; }
    public List<string>? OptionValue { get; set; } // Birden fazla seçenek olabilir
    public int SearchLogic { get; set; } // VE / VEYA mantığı için
}