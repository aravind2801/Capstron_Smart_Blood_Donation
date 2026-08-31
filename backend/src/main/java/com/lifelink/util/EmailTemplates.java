package com.lifelink.util;

import com.lifelink.entity.BloodRequest;
import com.lifelink.entity.User;
import com.lifelink.enums.BloodGroup;

import java.util.Locale;

/**
 * Builds HTML bodies for transactional emails.
 */
public final class EmailTemplates {

    private EmailTemplates() {
    }

    public static String donationRequestToDonor(User donor, BloodRequest request, Double distanceKm) {
        String distanceText = distanceKm == null || distanceKm.isInfinite()
                ? "Your district"
                : String.format(Locale.US, "%.1f km from you", distanceKm);
        String emergencyBadge = request.isEmergency()
                ? "<p style=\"color:#b91c1c;font-weight:700;font-size:15px;\">\u26A0 EMERGENCY REQUEST</p>"
                : "";

        return wrapper(
                "A blood request needs you",
                "<h2>Hello " + escape(donor.getName()) + ",</h2>"
                        + emergencyBadge
                        + "<p><strong>" + escape(request.getPatientName()) + "</strong> urgently needs "
                        + request.getUnits() + " unit(s) of <strong>" + request.getBloodGroup().getValue()
                        + "</strong> blood.</p>"
                        + "<ul>"
                        + "<li><strong>Hospital:</strong> " + escape(request.getHospitalName()) + "</li>"
                        + "<li><strong>Address:</strong> " + escape(orDash(request.getHospitalAddress())) + "</li>"
                        + "<li><strong>Reason:</strong> " + escape(orDash(request.getReason())) + "</li>"
                        + "<li><strong>Distance:</strong> " + distanceText + "</li>"
                        + "</ul>"
                        + "<p>If you can help, please log in to LifeLink and accept the request from your "
                        + "notifications. Every minute counts.</p>"
                        + "<p style=\"color:#6b7280;font-size:13px;\">If you cannot donate, please decline the "
                        + "request in the app so other donors are alerted faster.</p>"
        );
    }

    public static String requestAcceptedToPatient(User donor, BloodRequest request) {
        int arrival = Haversine.estimatedArrivalMinutes(
                Haversine.distanceKm(request.getPatient().getLatitude(), request.getPatient().getLongitude(),
                        donor.getLatitude(), donor.getLongitude()));
        return wrapper(
                "Your blood request has been accepted",
                "<h2>Great news!</h2>"
                        + "<p>Your blood request for <strong>" + request.getUnits() + " unit(s) of "
                        + request.getBloodGroup().getValue() + "</strong> at "
                        + escape(request.getHospitalName()) + " has been accepted by a donor.</p>"
                        + "<h3>Donor details</h3>"
                        + "<ul>"
                        + "<li><strong>Name:</strong> " + escape(donor.getName()) + "</li>"
                        + "<li><strong>Phone:</strong> " + escape(donor.getPhone()) + "</li>"
                        + "<li><strong>Blood group:</strong> " + donor.getBloodGroup().getValue() + "</li>"
                        + "<li><strong>Estimated arrival:</strong> ~" + arrival + " minutes</li>"
                        + "</ul>"
                        + "<p>Please contact the donor to coordinate the donation.</p>"
        );
    }

    public static String donationCompleted(User donor, User patient, BloodRequest request) {
        return wrapper(
                "Donation completed",
                "<h2>Thank you for saving a life!</h2>"
                        + "<p>A <strong>" + request.getBloodGroup().getValue() + "</strong> blood donation of "
                        + request.getUnits() + " unit(s) has been marked complete.</p>"
                        + "<ul>"
                        + "<li><strong>Donor:</strong> " + escape(donor.getName()) + "</li>"
                        + "<li><strong>Patient:</strong> " + escape(patient.getName()) + "</li>"
                        + "<li><strong>Hospital:</strong> " + escape(orDash(request.getHospitalName())) + "</li>"
                        + "</ul>"
                        + "<p>The donation has been recorded permanently in your history.</p>"
        );
    }

    public static String passwordReset(User user, String resetLink) {
        return wrapper(
                "Reset your password",
                "<h2>Hello " + escape(user.getName()) + ",</h2>"
                        + "<p>We received a request to reset your password. Click the button below to choose a "
                        + "new one. This link is valid for 30 minutes.</p>"
                        + "<p style=\"text-align:center;\"><a href=\"" + resetLink + "\" style=\""
                        + "background:#dc2626;color:#ffffff;padding:12px 24px;border-radius:8px;"
                        + "text-decoration:none;font-weight:700;\">Reset password</a></p>"
                        + "<p style=\"color:#6b7280;font-size:13px;\">If you did not request this, you can safely "
                        + "ignore this email.</p>"
        );
    }

    public static String welcome(User user) {
        return wrapper(
                "Welcome to LifeLink",
                "<h2>Welcome, " + escape(user.getName()) + "!</h2>"
                        + "<p>Your " + user.getRole().name().toLowerCase() + " account has been created on "
                        + "LifeLink - Smart Blood Donation Network.</p>"
                        + "<p>Keep your availability up to date so we can match you with people in need.</p>"
        );
    }

    private static String wrapper(String title, String innerHtml) {
        return "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"></head>"
                + "<body style=\"margin:0;padding:0;background:#fef2f2;font-family:Arial,Helvetica,sans-serif;\">"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#fef2f2;padding:24px 12px;\">"
                + "<tr><td align=\"center\">"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #fecaca;\">"
                + "<tr><td style=\"background:linear-gradient(135deg,#dc2626,#b91c1c);padding:22px 28px;\">"
                + "<span style=\"color:#ffffff;font-size:22px;font-weight:800;\">\u2764 LifeLink</span>"
                + "<span style=\"color:#fecaca;font-size:13px;display:block;margin-top:2px;\">Smart Blood Donation Network</span>"
                + "</td></tr>"
                + "<tr><td style=\"padding:28px;color:#111827;\">"
                + innerHtml
                + "<p style=\"margin-top:28px;color:#6b7280;font-size:12px;\">This is an automated message from "
                + "LifeLink. Please do not reply to this email.</p>"
                + "</td></tr></table></td></tr></table></body></html>";
    }

    private static String escape(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#39;");
    }

    private static String orDash(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }
}
