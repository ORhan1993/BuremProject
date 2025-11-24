using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace Burem.Data.Models;

public partial class BuremDbContext : DbContext
{
    public BuremDbContext()
    {
    }

    public BuremDbContext(DbContextOptions<BuremDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Answer> Answers { get; set; }

    public virtual DbSet<ErrorLog> ErrorLogs { get; set; }

    public virtual DbSet<ExcelView> ExcelViews { get; set; }

    public virtual DbSet<IpList> IpLists { get; set; }

    public virtual DbSet<Log> Logs { get; set; }

    public virtual DbSet<Option> Options { get; set; }

    public virtual DbSet<Question> Questions { get; set; }

    public virtual DbSet<QuestionGroup> QuestionGroups { get; set; }

    public virtual DbSet<QuestionType> QuestionTypes { get; set; }

    public virtual DbSet<SearchView> SearchViews { get; set; }

    public virtual DbSet<Session> Sessions { get; set; }

    public virtual DbSet<SiteContent> SiteContents { get; set; }

    public virtual DbSet<Student> Students { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<Appointment> Appointments { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Server=193.140.192.77;Database=buremkayit2;user id=buremkayit;password=uWPLeo4sL4;MultipleActiveResultSets=True;TrustServerCertificate=True;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Answer>(entity =>
        {
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.OptionTitle).HasMaxLength(4000);
            entity.Property(e => e.OptionValue).HasMaxLength(4000);
            entity.Property(e => e.QuestionId).HasColumnName("QuestionID");
            entity.Property(e => e.QuestionTitle).HasMaxLength(255);
            entity.Property(e => e.SessionId).HasColumnName("SessionID");
            entity.Property(e => e.StudentId).HasColumnName("StudentID");

            entity.HasOne(d => d.Session).WithMany(p => p.Answers)
                .HasForeignKey(d => d.SessionId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Answers_Sessions");
        });

        modelBuilder.Entity<ErrorLog>(entity =>
        {
            entity.HasKey(e => e.ErrorId);

            entity.Property(e => e.ErrorId).HasColumnName("ErrorID");
        });

        modelBuilder.Entity<ExcelView>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("ExcelView");

            entity.Property(e => e.BasvuruTuru)
                .HasMaxLength(19)
                .IsUnicode(false);
            entity.Property(e => e.Gpa).HasColumnName("GPA");
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.IsDadAlive).HasColumnName("isDadAlive");
            entity.Property(e => e.IsImported).HasColumnName("isImported");
            entity.Property(e => e.IsMotherAlive).HasColumnName("isMotherAlive");
            entity.Property(e => e.IsScholar).HasColumnName("isScholar");
            entity.Property(e => e.IsWorking).HasColumnName("isWorking");
            entity.Property(e => e.OptionValue).HasMaxLength(4000);
            entity.Property(e => e.QuestionId).HasColumnName("QuestionID");
            entity.Property(e => e.QuestionTitle).HasMaxLength(513);
            entity.Property(e => e.SessionId).HasColumnName("SessionID");
            entity.Property(e => e.StudentId).HasColumnName("StudentID");
        });

        modelBuilder.Entity<IpList>(entity =>
        {
            entity.ToTable("IpList");

            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.CreatedDate).HasColumnType("datetime");
            entity.Property(e => e.Ip)
                .HasMaxLength(50)
                .HasColumnName("IP");
        });

        modelBuilder.Entity<Log>(entity =>
        {
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.LogDate).HasColumnType("datetime");
            entity.Property(e => e.LogUser).HasMaxLength(250);
        });

        modelBuilder.Entity<Option>(entity =>
        {
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.OptionTitle).HasMaxLength(255);
            entity.Property(e => e.OptionTitleStudent).HasMaxLength(255);
            entity.Property(e => e.OptionValue)
                .HasMaxLength(255)
                .HasDefaultValueSql("((0))", "DF_Options_OptionValue");
            entity.Property(e => e.ParentOption).HasMaxLength(255);
            entity.Property(e => e.QuestionId).HasColumnName("QuestionID");

            entity.HasOne(d => d.Question).WithMany(p => p.Options)
                .HasForeignKey(d => d.QuestionId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Options_Questions");
        });

        modelBuilder.Entity<Question>(entity =>
        {
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.CanStudentAnswer).HasColumnName("canStudentAnswer");
            entity.Property(e => e.DisplayOrderNo).HasDefaultValue((byte)1, "DF_Questions_DisplayOrder");
            entity.Property(e => e.IsActive).HasColumnName("isActive");
            entity.Property(e => e.IsProfileQuestion).HasColumnName("isProfileQuestion");
            entity.Property(e => e.QuestionTitle).HasMaxLength(255);
            entity.Property(e => e.QuestionTitleForStudents).HasMaxLength(255);
        });

        modelBuilder.Entity<QuestionGroup>(entity =>
        {
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.GroupName)
                .HasMaxLength(250)
                .IsUnicode(false);
        });

        modelBuilder.Entity<QuestionType>(entity =>
        {
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.QuestionType1)
                .HasMaxLength(255)
                .HasColumnName("QuestionType");
        });

        modelBuilder.Entity<SearchView>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("SearchView");

            entity.Property(e => e.AdvisorId).HasColumnName("AdvisorID");
            entity.Property(e => e.BasvuruTuru)
                .HasMaxLength(19)
                .IsUnicode(false);
            entity.Property(e => e.Gpa).HasColumnName("GPA");
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.IsDadAlive).HasColumnName("isDadAlive");
            entity.Property(e => e.IsImported).HasColumnName("isImported");
            entity.Property(e => e.IsMotherAlive).HasColumnName("isMotherAlive");
            entity.Property(e => e.IsScholar).HasColumnName("isScholar");
            entity.Property(e => e.IsWorking).HasColumnName("isWorking");
            entity.Property(e => e.OptionTitle).HasMaxLength(4000);
            entity.Property(e => e.OptionValue).HasMaxLength(4000);
            entity.Property(e => e.QuestionId).HasColumnName("QuestionID");
            entity.Property(e => e.QuestionTitle).HasMaxLength(255);
            entity.Property(e => e.SessionDate).HasColumnType("datetime");
            entity.Property(e => e.SessionId).HasColumnName("SessionID");
            entity.Property(e => e.StudentId).HasColumnName("StudentID");
        });

        modelBuilder.Entity<Session>(entity =>
        {
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.AdvisorId).HasColumnName("AdvisorID");
            entity.Property(e => e.IsArchived).HasColumnName("isArchived");
            entity.Property(e => e.IsOnline)
                .HasDefaultValue(false, "DF_Sessions_isOnline")
                .HasColumnName("isOnline");
            entity.Property(e => e.SessionDate).HasColumnType("datetime");
            entity.Property(e => e.StudentId).HasColumnName("StudentID");

            entity.HasOne(d => d.Student).WithMany(p => p.Sessions)
                .HasForeignKey(d => d.StudentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Sessions_Students");
        });

        modelBuilder.Entity<SiteContent>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__SiteCont__3214EC2745F1D1BA");

            entity.ToTable("SiteContent");

            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.ContentKey).HasMaxLength(255);
        });

        modelBuilder.Entity<Student>(entity =>
        {
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.CreatedDate).HasColumnType("datetime");
            entity.Property(e => e.Gpa).HasColumnName("GPA");
            entity.Property(e => e.IsDadAlive).HasColumnName("isDadAlive");
            entity.Property(e => e.IsImported).HasColumnName("isImported");
            entity.Property(e => e.IsMotherAlive).HasColumnName("isMotherAlive");
            entity.Property(e => e.IsScholar).HasColumnName("isScholar");
            entity.Property(e => e.IsWorking).HasColumnName("isWorking");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.FirstName).HasMaxLength(150);
            entity.Property(e => e.LastName).HasMaxLength(150);
            entity.Property(e => e.UserName).HasMaxLength(255);
        });

        modelBuilder.Entity<Session>(entity =>
        {
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.StudentId).HasColumnName("StudentID");
            entity.Property(e => e.AdvisorId).HasColumnName("AdvisorID"); // DB'deki kolon adı

            // İLİŞKİ TANIMI (AdvisorID1 hatasını çözen yer)
            entity.HasOne(d => d.Advisor)
                  .WithMany()
                  .HasForeignKey(d => d.AdvisorId)
                  .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.Student)
                  .WithMany(p => p.Sessions)
                  .HasForeignKey(d => d.StudentId)
                  .OnDelete(DeleteBehavior.ClientSetNull);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
