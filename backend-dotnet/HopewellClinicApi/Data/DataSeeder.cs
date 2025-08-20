using Microsoft.EntityFrameworkCore;
using HopewellClinicApi.Models;
using BCrypt.Net;

namespace HopewellClinicApi.Data
{
    public static class DataSeeder
    {
        public static void SeedData(ModelBuilder modelBuilder)
        {
            // Seed Services
            var services = new[]
            {
                new Service
                {
                    Id = Guid.Parse("550e8400-e29b-41d4-a716-446655440000"),
                    Name = "General Consultation",
                    Description = "General medical consultation and examination",
                    DurationMinutes = 30,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-30),
                    UpdatedAt = DateTime.UtcNow.AddDays(-30)
                },
                new Service
                {
                    Id = Guid.Parse("550e8400-e29b-41d4-a716-446655440001"),
                    Name = "Blood Pressure Check",
                    Description = "Blood pressure monitoring and assessment",
                    DurationMinutes = 15,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-30),
                    UpdatedAt = DateTime.UtcNow.AddDays(-30)
                },
                new Service
                {
                    Id = Guid.Parse("550e8400-e29b-41d4-a716-446655440002"),
                    Name = "Diabetes Screening",
                    Description = "Blood glucose testing and diabetes consultation",
                    DurationMinutes = 45,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-30),
                    UpdatedAt = DateTime.UtcNow.AddDays(-30)
                },
                new Service
                {
                    Id = Guid.Parse("550e8400-e29b-41d4-a716-446655440003"),
                    Name = "Vaccination",
                    Description = "Immunization services",
                    DurationMinutes = 20,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-30),
                    UpdatedAt = DateTime.UtcNow.AddDays(-30)
                },
                new Service
                {
                    Id = Guid.Parse("550e8400-e29b-41d4-a716-446655440004"),
                    Name = "Health Education",
                    Description = "Community health education and awareness",
                    DurationMinutes = 60,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-30),
                    UpdatedAt = DateTime.UtcNow.AddDays(-30)
                }
            };

            // Seed Staff
            var staff = new[]
            {
                new Staff
                {
                    Id = Guid.Parse("550e8400-e29b-41d4-a716-446655441000"),
                    UserId = Guid.Parse("550e8400-e29b-41d4-a716-446655441001"),
                    StaffNumber = "DOC001",
                    FirstName = "Dr. Nomsa",
                    LastName = "Mandela",
                    Phone = "+27123456789",
                    Role = "doctor",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-30),
                    UpdatedAt = DateTime.UtcNow.AddDays(-30)
                },
                new Staff
                {
                    Id = Guid.Parse("550e8400-e29b-41d4-a716-446655441002"),
                    UserId = Guid.Parse("550e8400-e29b-41d4-a716-446655441003"),
                    StaffNumber = "DOC002",
                    FirstName = "Dr. Thabo",
                    LastName = "Sithole",
                    Phone = "+27123456790",
                    Role = "doctor",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-30),
                    UpdatedAt = DateTime.UtcNow.AddDays(-30)
                },
                new Staff
                {
                    Id = Guid.Parse("550e8400-e29b-41d4-a716-446655441004"),
                    UserId = Guid.Parse("550e8400-e29b-41d4-a716-446655441005"),
                    StaffNumber = "NUR001",
                    FirstName = "Sister Zanele",
                    LastName = "Dlamini",
                    Phone = "+27123456791",
                    Role = "nurse",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-30),
                    UpdatedAt = DateTime.UtcNow.AddDays(-30)
                },
                new Staff
                {
                    Id = Guid.Parse("550e8400-e29b-41d4-a716-446655441006"),
                    UserId = Guid.Parse("550e8400-e29b-41d4-a716-446655441007"),
                    StaffNumber = "ADM001",
                    FirstName = "Sipho",
                    LastName = "Mthembu",
                    Phone = "+27123456792",
                    Role = "admin",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-30),
                    UpdatedAt = DateTime.UtcNow.AddDays(-30)
                }
            };

            // Seed Time Slots (Monday to Friday, 8 AM to 5 PM)
            var timeSlots = new List<TimeSlot>();
            var timeSlotId = 1000;
            
            for (int dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) // Monday to Friday
            {
                for (int hour = 8; hour < 17; hour++) // 8 AM to 5 PM
                {
                    timeSlots.Add(new TimeSlot
                    {
                        Id = Guid.Parse($"550e8400-e29b-41d4-a716-{timeSlotId:D12}"),
                        DayOfWeek = dayOfWeek,
                        StartTime = new TimeSpan(hour, 0, 0),
                        EndTime = new TimeSpan(hour + 1, 0, 0),
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow.AddDays(-30)
                    });
                    timeSlotId++;
                }
            }

            // Seed Patients
            var patients = new[]
            {
                new Patient
                {
                    Id = Guid.Parse("550e8400-e29b-41d4-a716-446655442000"),
                    PatientNumber = "PAT001",
                    FirstName = "Nomonde",
                    LastName = "Gcaba",
                    Phone = "+27821234567",
                    Email = "nomonde.gcaba@example.com",
                    DateOfBirth = new DateTime(1985, 3, 15),
                    Address = "123 Main Street, Qunu Village",
                    EmergencyContactName = "Sizani Gcaba",
                    EmergencyContactPhone = "+27821234568",
                    CreatedAt = DateTime.UtcNow.AddDays(-20),
                    UpdatedAt = DateTime.UtcNow.AddDays(-20)
                },
                new Patient
                {
                    Id = Guid.Parse("550e8400-e29b-41d4-a716-446655442001"),
                    PatientNumber = "PAT002",
                    FirstName = "Mandla",
                    LastName = "Ntuli",
                    Phone = "+27821234569",
                    Email = "mandla.ntuli@example.com",
                    DateOfBirth = new DateTime(1978, 7, 22),
                    Address = "456 Church Road, Qunu Village",
                    EmergencyContactName = "Thandi Ntuli",
                    EmergencyContactPhone = "+27821234570",
                    CreatedAt = DateTime.UtcNow.AddDays(-18),
                    UpdatedAt = DateTime.UtcNow.AddDays(-18)
                },
                new Patient
                {
                    Id = Guid.Parse("550e8400-e29b-41d4-a716-446655442002"),
                    PatientNumber = "PAT003",
                    FirstName = "Bongiwe",
                    LastName = "Mthembu",
                    Phone = "+27821234571",
                    Email = "bongiwe.mthembu@example.com",
                    DateOfBirth = new DateTime(1992, 11, 8),
                    Address = "789 School Lane, Qunu Village",
                    EmergencyContactName = "Sithembile Mthembu",
                    EmergencyContactPhone = "+27821234572",
                    CreatedAt = DateTime.UtcNow.AddDays(-15),
                    UpdatedAt = DateTime.UtcNow.AddDays(-15)
                }
            };

            // Apply seed data
            modelBuilder.Entity<Service>().HasData(services);
            modelBuilder.Entity<Staff>().HasData(staff);
            modelBuilder.Entity<TimeSlot>().HasData(timeSlots);
            modelBuilder.Entity<Patient>().HasData(patients);
        }
    }
}