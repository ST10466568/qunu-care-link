using Microsoft.EntityFrameworkCore;
using HopewellClinicApi.Data;
using HopewellClinicApi.Models;
using HopewellClinicApi.DTOs;

namespace HopewellClinicApi.Services
{
    public class UserService
    {
        private readonly HopewellDbContext _context;

        public UserService(HopewellDbContext context)
        {
            _context = context;
        }

        public async Task<(UserResponse user, PatientResponse? patient, StaffResponse? staff)> GetUserSessionAsync(Guid userId)
        {
            // Try to find as patient first
            var patient = await _context.Patients
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (patient != null)
            {
                var userResponse = new UserResponse
                {
                    Id = userId,
                    Email = patient.Email ?? "",
                    UserType = "patient"
                };

                var patientResponse = new PatientResponse
                {
                    Id = patient.Id,
                    UserId = patient.UserId,
                    PatientNumber = patient.PatientNumber,
                    FirstName = patient.FirstName,
                    LastName = patient.LastName,
                    Phone = patient.Phone,
                    Email = patient.Email,
                    DateOfBirth = patient.DateOfBirth,
                    Address = patient.Address,
                    EmergencyContactName = patient.EmergencyContactName,
                    EmergencyContactPhone = patient.EmergencyContactPhone,
                    CreatedAt = patient.CreatedAt,
                    UpdatedAt = patient.UpdatedAt
                };

                return (userResponse, patientResponse, null);
            }

            // Try to find as staff
            var staff = await _context.Staff
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (staff != null)
            {
                var userResponse = new UserResponse
                {
                    Id = userId,
                    Email = "",
                    UserType = "staff"
                };

                var staffResponse = new StaffResponse
                {
                    Id = staff.Id,
                    UserId = staff.UserId,
                    StaffNumber = staff.StaffNumber,
                    FirstName = staff.FirstName,
                    LastName = staff.LastName,
                    Role = staff.Role,
                    Phone = staff.Phone,
                    IsActive = staff.IsActive,
                    CreatedAt = staff.CreatedAt,
                    UpdatedAt = staff.UpdatedAt
                };

                return (userResponse, null, staffResponse);
            }

            throw new InvalidOperationException("User not found");
        }

        public async Task<Patient?> FindPatientByEmailAsync(string email)
        {
            return await _context.Patients
                .FirstOrDefaultAsync(p => p.Email == email);
        }

        public async Task<bool> PatientExistsAsync(string email)
        {
            return await _context.Patients
                .AnyAsync(p => p.Email == email);
        }
    }
}