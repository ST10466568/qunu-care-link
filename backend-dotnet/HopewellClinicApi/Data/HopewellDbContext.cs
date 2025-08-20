using Microsoft.EntityFrameworkCore;
using HopewellClinicApi.Models;

namespace HopewellClinicApi.Data
{
    public class HopewellDbContext : DbContext
    {
        public HopewellDbContext(DbContextOptions<HopewellDbContext> options) : base(options)
        {
        }

        public DbSet<Service> Services { get; set; }
        public DbSet<Patient> Patients { get; set; }
        public DbSet<Staff> Staff { get; set; }
        public DbSet<TimeSlot> TimeSlots { get; set; }
        public DbSet<Appointment> Appointments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure relationships
            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Patient)
                .WithMany(p => p.Appointments)
                .HasForeignKey(a => a.PatientId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Service)
                .WithMany(s => s.Appointments)
                .HasForeignKey(a => a.ServiceId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Staff)
                .WithMany(s => s.Appointments)
                .HasForeignKey(a => a.StaffId)
                .OnDelete(DeleteBehavior.SetNull);

            // Configure unique constraints
            modelBuilder.Entity<Patient>()
                .HasIndex(p => p.PatientNumber)
                .IsUnique();

            modelBuilder.Entity<Staff>()
                .HasIndex(s => s.UserId)
                .IsUnique();

            modelBuilder.Entity<Staff>()
                .HasIndex(s => s.StaffNumber)
                .IsUnique();

            // Configure property constraints
            modelBuilder.Entity<TimeSlot>()
                .Property(t => t.StartTime)
                .HasColumnType("time");

            modelBuilder.Entity<TimeSlot>()
                .Property(t => t.EndTime)
                .HasColumnType("time");

            modelBuilder.Entity<Appointment>()
                .Property(a => a.StartTime)
                .HasColumnType("time");

            modelBuilder.Entity<Appointment>()
                .Property(a => a.EndTime)
                .HasColumnType("time");

            modelBuilder.Entity<Appointment>()
                .Property(a => a.AppointmentDate)
                .HasColumnType("date");

            modelBuilder.Entity<Patient>()
                .Property(p => p.DateOfBirth)
                .HasColumnType("date");

            // Seed initial data
            DataSeeder.SeedData(modelBuilder);
        }
    }
}