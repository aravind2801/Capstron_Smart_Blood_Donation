package com.lifelink.service;

import com.lifelink.util.EmailTemplates;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.MailException;

/**
 * Sends transactional emails. When {@code app.email.enabled} is false the
 * message is logged instead, so development works without an SMTP server.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final boolean enabled;
    private final String from;

    public EmailService(JavaMailSender mailSender,
                        @Value("${app.email.enabled:false}") boolean enabled,
                        @Value("${app.email.from:LifeLink}") String from) {
        this.mailSender = mailSender;
        this.enabled = enabled;
        this.from = from;
    }

    public void sendDonationRequestToDonor(String to, com.lifelink.entity.User donor,
                                           com.lifelink.entity.BloodRequest request, Double distanceKm) {
        send(to, "LifeLink - A blood request needs you",
                EmailTemplates.donationRequestToDonor(donor, request, distanceKm));
    }

    public void sendRequestAcceptedToPatient(String to, com.lifelink.entity.User donor, com.lifelink.entity.BloodRequest request) {
        send(to, "LifeLink - Your blood request has been accepted",
                EmailTemplates.requestAcceptedToPatient(donor, request));
    }

    public void sendDonationCompleted(String to, com.lifelink.entity.User donor, com.lifelink.entity.User patient,
                                      com.lifelink.entity.BloodRequest request) {
        send(to, "LifeLink - Donation completed",
                EmailTemplates.donationCompleted(donor, patient, request));
    }

    public void sendPasswordReset(String to, com.lifelink.entity.User user, String resetLink) {
        send(to, "LifeLink - Reset your password", EmailTemplates.passwordReset(user, resetLink));
    }

    public void sendWelcome(String to, com.lifelink.entity.User user) {
        send(to, "Welcome to LifeLink", EmailTemplates.welcome(user));
    }

    private void send(String to, String subject, String htmlBody) {
        if (!enabled) {
            log.info("\n===== [EMAIL SIMULATED] =====\nTO: {}\nSUBJECT: {}\n{}\n============================", to, subject, htmlBody);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setFrom(from);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
        } catch (MailException | jakarta.mail.MessagingException ex) {
            log.error("Failed to send email to {}: {}", to, ex.getMessage());
        }
    }
}
