using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Burem.Data.Models;
using ClosedXML.Excel;
using System.IO;
using Burem.Data;

[Route("api/[controller]")]
[ApiController]
public class ExportController : ControllerBase
{
    private readonly BuremDbContext _context;

    public ExportController(BuremDbContext context)
    {
        _context = context;
    }

    [HttpPost("ToExcel")]
    public async Task<IActionResult> ExportToExcel([FromBody] SearchCriteriaDto criteria)
    {
        // 1. Arama kriterlerine göre veriyi çek (StudentsController'daki mantığın aynısı)
        var query = _context.Students.Include(s => s.Sessions).AsQueryable();

        if (!string.IsNullOrEmpty(criteria.StudentNo)) query = query.Where(s => s.StudentNo.Contains(criteria.StudentNo));
        if (!string.IsNullOrEmpty(criteria.FirstName)) query = query.Where(s => s.FirstName.Contains(criteria.FirstName));
        // ... Diğer filtreler buraya eklenebilir ...

        var students = await query.ToListAsync();

        // 2. Excel Dosyasını Oluştur
        using (var workbook = new XLWorkbook())
        {
            var worksheet = workbook.Worksheets.Add("Ogrenci Listesi");

            // Başlıklar
            worksheet.Cell(1, 1).Value = "Öğrenci No";
            worksheet.Cell(1, 2).Value = "Ad";
            worksheet.Cell(1, 3).Value = "Soyad";
            worksheet.Cell(1, 4).Value = "Fakülte";
            worksheet.Cell(1, 5).Value = "Bölüm";
            worksheet.Cell(1, 6).Value = "Toplam Başvuru";

            // Veriler
            int row = 2;
            foreach (var s in students)
            {
                worksheet.Cell(row, 1).Value = s.StudentNo;
                worksheet.Cell(row, 2).Value = s.FirstName;
                worksheet.Cell(row, 3).Value = s.LastName;
                worksheet.Cell(row, 4).Value = s.Faculty;
                worksheet.Cell(row, 5).Value = s.Department;
                worksheet.Cell(row, 6).Value = s.Sessions.Count;
                row++;
            }

            // Stil Ayarları
            worksheet.Columns().AdjustToContents();

            // Dosyayı MemoryStream'e kaydet ve döndür
            using (var stream = new MemoryStream())
            {
                workbook.SaveAs(stream);
                var content = stream.ToArray();
                return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "OgrenciListesi.xlsx");
            }
        }
    }
}