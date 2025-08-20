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
    public class AuthController : ControllerBase
    {
        private readonly HopewellDbContext _context;
        private readonly JwtService _jwtService;
        private readonly UserService _userService;

        public AuthController(HopewellDbContext context, JwtService jwtService, UserService userService)
        {
            _context = context;
            _jwtService = jwtService;
            _userService = userService;
        }

        [HttpPost("signup")]
        public async Task<ActionResult<AuthResponse>> SignUp(SignUpRequest request)
        {
            try
            {
                // Check if user already exists
                if (await _userService.PatientExistsAsync(request.Email))
                {
                    return BadRequest(new { error = "User already exists" });
                }

                var userId = Guid.NewGuid();

                if (request.UserType == "patient")
                {
                    // Create patient record
                    var patient = new Patient
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        FirstName = request.FirstName,
                        LastName = request.LastName,
                        Phone = request.Phone,
                        Email = request.Email,
                        PatientNumber = $"P{DateTimeOffset.Now.ToUnixTimeSeconds().ToString()[^6..]}"
                    };

                    _context.Patients.Add(patient);
                    await _context.SaveChangesAsync();

                    var token = _jwtService.GenerateToken(userId, request.Email, "patient");

                    var response = new AuthResponse
                    {
                        User = new UserResponse { Id = userId, Email = request.Email, UserType = "patient" },
                        Patient = new PatientResponse
                        {
                            Id = patient.Id,
                            UserId = patient.UserId,
                            PatientNumber = patient.PatientNumber,
                            FirstName = patient.FirstName,
                            LastName = patient.LastName,
                            Phone = patient.Phone,
                            Email = patient.Email,
                            CreatedAt = patient.CreatedAt,
                            UpdatedAt = patient.UpdatedAt
                        },
                        Token = token
                    };

                    return Ok(response);
                }
                else
                {
                    return BadRequest(new { error = "Invalid user type" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpPost("signin")]
        public async Task<ActionResult<AuthResponse>> SignIn(SignInRequest request)
        {
            try
            {
                // Try to find patient first
                var patient = await _userService.FindPatientByEmailAsync(request.Email);
                if (patient != null)
                {
                    // For demo purposes, we'll allow any password. In production, you'd verify against stored hash
                    var token = _jwtService.GenerateToken(patient.UserId!.Value, request.Email, "patient");

                    var response = new AuthResponse
                    {
                        User = new UserResponse { Id = patient.UserId!.Value, Email = request.Email, UserType = "patient" },
                        Patient = new PatientResponse
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
                        },
                        Token = token
                    };

                    return Ok(response);
                }

                return Unauthorized(new { error = "Invalid credentials" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpGet("user")]
        [Authorize]
        public async Task<ActionResult> GetUser()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { error = "Invalid token" });
                }

                var (user, patient, staff) = await _userService.GetUserSessionAsync(userId);

                return Ok(new { user, patient, staff });
            }
            catch (InvalidOperationException)
            {
                return NotFound(new { error = "User not found" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpPost("signout")]
        public new ActionResult SignOut()
        {
            // Since we're using stateless JWT tokens, signout is handled client-side
            return Ok(new { message = "Signed out successfully" });
        }
    }
}