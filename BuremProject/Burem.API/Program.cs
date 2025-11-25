using Burem.API.Abstract;
using Burem.API.Concrete;
using Burem.Data.Models; // Burasý Data projesindeki namespace ile ayný olmalý
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// CORS Politikasýný Tanýmla (React'e izin ver)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173") // React genelde bu portta baþlar
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// --- SERVÝSLERÝN EKLENDÝÐÝ BÖLÜM ---

builder.Services.AddControllers();

// Swagger / OpenAPI ayarlarý (API test ekraný için)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 1. ADIM: Veritabaný Baðlantý Cümlesini appsettings.json'dan okuyoruz
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// 2. ADIM: SQL Server Baðlantýsýný Servislere Ekliyoruz
// Scaffolding ile oluþan Context ismin 'BuremDbContext' olduðu varsayýldý.
builder.Services.AddDbContext<BuremDbContext>(options =>
    options.UseSqlServer(connectionString));
builder.Services.AddScoped<IStudentService, StudentConcrete>();
builder.Services.AddScoped<ISessionService, SessionConcrete>();

var app = builder.Build();

// --- HTTP ÝSTEK HATTI (PIPELINE) ---

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

app.UseCors("AllowReactApp");

app.UseAuthorization();

app.MapControllers();

app.Run();