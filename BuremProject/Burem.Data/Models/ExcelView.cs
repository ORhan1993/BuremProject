using System;
using System.Collections.Generic;

namespace Burem.Data.Models;

public partial class ExcelView
{
    public int Id { get; set; }

    public string? StudentNo { get; set; }

    public string? FirstName { get; set; }

    public string? LastName { get; set; }

    public string? MobilePhone { get; set; }

    public string? OtherPhone { get; set; }

    public string? Email { get; set; }

    public int? Gender { get; set; }

    public int? BirthDate { get; set; }

    public string? BirthPlace { get; set; }

    public string? ContactPerson { get; set; }

    public string? ContactPhone { get; set; }

    public string? Nationality { get; set; }

    public string? MaritalStatus { get; set; }

    public string? HighSchool { get; set; }

    public string? AcademicLevel { get; set; }

    public string? Lifestyle { get; set; }

    public string? CurrentAdress { get; set; }

    public string? ConstantAdress { get; set; }

    public string? DormName { get; set; }

    public string? DormNo { get; set; }

    public string? DormTel { get; set; }

    public string? ContactDegree { get; set; }

    public string? Faculty { get; set; }

    public string? Department { get; set; }

    public double? Gpa { get; set; }

    public string? PreparationLevel { get; set; }

    public string? IsScholar { get; set; }

    public string? IsWorking { get; set; }

    public string? IsMotherAlive { get; set; }

    public string? MotherAge { get; set; }

    public string? MotherAcademicLevel { get; set; }

    public string? MotherProfession { get; set; }

    public string? IsDadAlive { get; set; }

    public string? DadAge { get; set; }

    public string? DadAcademicLevel { get; set; }

    public string? DadProfession { get; set; }

    public string? ParentMarriage { get; set; }

    public string? SisterAmount { get; set; }

    public string? BrotherAmount { get; set; }

    public string? BrotherSisterTotal { get; set; }

    public int? Semester { get; set; }

    public string? SuicidePlan { get; set; }

    public string? SuicideAttempt { get; set; }

    public bool? IsImported { get; set; }

    public string? Expr1 { get; set; }

    public string? Expr2 { get; set; }

    public int StudentId { get; set; }

    public int QuestionId { get; set; }

    public string? QuestionTitle { get; set; }

    public string? OptionValue { get; set; }

    public int SessionId { get; set; }

    public string? BasvuruTuru { get; set; }
}
