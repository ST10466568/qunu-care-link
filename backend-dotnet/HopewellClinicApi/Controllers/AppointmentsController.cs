using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using HopewellClinicApi.Data;
using HopewellClinicApi.Models;
using HopewellClinicApi.DTOs;
using HopewellClinicApi.Services;
using System.Security.Claims;

namespace HopewellClinicApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AppointmentsController : ControllerBase
    {
        private readonly HopewellDbContext _context;
        private readonly UserService _userService;

        public AppointmentsController(HopewellDbContext context, UserService userService)
        {
            _context = context;
            _userService = userService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AppointmentResponse>>> GetAppointments()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { error = "Invalid token" });
                }

                var (user, patient, staff) = await _userService.GetUserSessionAsync(userId);

                if (patient != null)
                {
                    var appointments = await _context.Appointments
                        .Include(a => a.Service)
                        .Where(a => a.PatientId == patient.Id)
                        .Select(a => new AppointmentResponse
                        {
                            Id = a.Id,
                            AppointmentDate = a.AppointmentDate,
                            StartTime = a.StartTime,
                            EndTime = a.EndTime,
                            Status = a.Status,
                            Notes = a.Notes,
                            Service = new ServiceResponse
                            {
                                Id = a.Service.Id,
                                Name = a.Service.Name,
                                Description = a.Service.Description,
                                DurationMinutes = a.Service.DurationMinutes
                            }
                        })
                        .ToListAsync();

                    return Ok(appointments);
                }
                else if (staff != null)
                {
                    var appointments = await _context.Appointments
                        .Include(a => a.Service)
                        .Include(a => a.Patient)
                        .Where(a => a.StaffId == staff.Id)
                        .Select(a => new AppointmentResponse
                        {
                            Id = a.Id,
                            AppointmentDate = a.AppointmentDate,
                            StartTime = a.StartTime,
                            EndTime = a.EndTime,
                            Status = a.Status,
                            Notes = a.Notes,
                            Patient = new PatientResponse
                            {
                                Id = a.Patient.Id,
                                FirstName = a.Patient.FirstName,
                                LastName = a.Patient.LastName,
                                Phone = a.Patient.Phone
                            },
                            Service = new ServiceResponse
                            {
                                Id = a.Service.Id,
                                Name = a.Service.Name,
                                Description = a.Service.Description,
                                DurationMinutes = a.Service.DurationMinutes
                            }
                        })
                        .ToListAsync();

                    return Ok(appointments);
                }

                return Ok(new List<AppointmentResponse>());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpPost]
        public async Task<ActionResult<Appointment>> CreateAppointment(CreateAppointmentRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { error = "Invalid token" });
                }

                var (user, patient, staff) = await _userService.GetUserSessionAsync(userId);

                if (patient == null)
                {
                    return Forbid("Only patients can book appointments");
                }

                var appointment = new Appointment
                {
                    Id = Guid.NewGuid(),
                    PatientId = patient.Id,
                    ServiceId = request.ServiceId,
                    AppointmentDate = request.AppointmentDate,
                    StartTime = request.StartTime,
                    EndTime = request.EndTime,
                    Status = "pending",
                    BookingType = "online",
                    Notes = request.Notes
                };

                _context.Appointments.Add(appointment);
                await _context.SaveChangesAsync();

                return Ok(appointment);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error" });
            }
        }
    }
}