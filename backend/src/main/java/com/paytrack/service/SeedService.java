package com.paytrack.service;

import com.paytrack.model.*;
import com.paytrack.repository.*;
import com.paytrack.security.CurrentUser;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Java port of the frontend's src/data/seed.js. Produces the same realistic
 * Indian small-business sample data (12 customers, 26 invoices, matching
 * payments, 3 reminders, business settings), all dated relative to "today"
 * so the dashboard always looks realistic whenever it's first opened/reset.
 */
@Service
public class SeedService {

    private final CustomerRepository customerRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final ReminderRepository reminderRepository;
    private final SettingsRepository settingsRepository;
    private final EntityManager entityManager;

    public SeedService(CustomerRepository customerRepository, InvoiceRepository invoiceRepository,
                        PaymentRepository paymentRepository, ReminderRepository reminderRepository,
                        SettingsRepository settingsRepository, EntityManager entityManager) {
        this.customerRepository = customerRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.reminderRepository = reminderRepository;
        this.settingsRepository = settingsRepository;
        this.entityManager = entityManager;
    }

    // id, name, contactPerson, email, phone, city, gstin
    private static final String[][] SEED_CUSTOMERS = {
        {"cus_abc", "ABC Traders", "Arjun Balan", "accounts@abctraders.in", "98401 23456", "Chennai", "33AABCA1234F1Z2"},
        {"cus_ce", "Chennai Electronics", "Priya Raman", "billing@chennaielectronics.in", "94440 56789", "Chennai", "33AACCC5678G1Z9"},
        {"cus_ka", "Kumar Agencies", "Senthil Kumar", "kumaragencies@gmail.com", "98841 34567", "Tambaram", "33AAKFK4321H1Z1"},
        {"cus_sls", "Sri Lakshmi Stores", "Lakshmi Narayanan", "srilakshmistores@yahoo.in", "90030 45678", "Mylapore", ""},
        {"cus_tz", "TechZone Solutions", "Karthik Iyer", "finance@techzone.co.in", "99620 78901", "Guindy", "33AAGCT9876J1Z4"},
        {"cus_gm", "GreenMart", "Meena Sundar", "purchase@greenmart.in", "97910 11223", "Velachery", "33AAHCG2468K1Z7"},
        {"cus_ravi", "Ravi Enterprises", "Ravi Shankar", "ravienterprises@gmail.com", "98410 99887", "Ambattur", "33AAQPR1357L1Z3"},
        {"cus_xyz", "XYZ Stores", "Farhan Ali", "xyzstores.chennai@gmail.com", "93805 44332", "Anna Nagar", ""},
        {"cus_mt", "Madurai Textiles", "Muthu Pandian", "accounts@maduraitextiles.com", "94432 66778", "Madurai", "33AAFCM8642M1Z6"},
        {"cus_cm", "Coimbatore Motors", "Deepa Venkatesh", "service@coimbatoremotors.in", "98430 22110", "Coimbatore", "33AABCC7531N1Z8"},
        {"cus_ab", "Anand Bakery", "Anand Raj", "anandbakery.adyar@gmail.com", "91766 55443", "Adyar", ""},
        {"cus_vh", "Velu Hardware", "Velmurugan S", "veluhardware@gmail.com", "97899 88776", "Porur", "33AAVPV9753P1Z0"},
    };

    private record LineItem(String description, int quantity, double unitPrice) {
    }

    private record PlannedPayment(int offset, Double amount, String method, String reference) {
        private static PlannedPayment full(int offset, String method, String reference) {
            return new PlannedPayment(offset, null, method, reference); // null amount = "full"
        }
    }

    private record PlannedInvoice(String customerId, int issueOffset, int dueOffset, List<LineItem> items,
                                   double discount, double taxRate, boolean isDraft, List<PlannedPayment> payments) {
    }

    private List<PlannedInvoice> buildInvoicePlan() {
        List<PlannedInvoice> plan = new ArrayList<>();
        plan.add(new PlannedInvoice("cus_ce", -175, -160, List.of(new LineItem("32\" LED display panels", 4, 6500)), 0, 18, false,
                List.of(PlannedPayment.full(-162, "Bank Transfer", "NEFT-HDFC-448120"))));
        plan.add(new PlannedInvoice("cus_ka", -140, -125, List.of(
                new LineItem("Office stationery – quarterly supply", 1, 15000),
                new LineItem("Printer cartridges (HP 88A)", 6, 850)), 0, 18, false,
                List.of(PlannedPayment.full(-120, "UPI", "UPI-409812345671"))));
        plan.add(new PlannedInvoice("cus_sls", -122, -107, List.of(new LineItem("POS billing software setup", 1, 22000)), 0, 18, false,
                List.of(PlannedPayment.full(-108, "Card", "CARD-XX4821"))));
        plan.add(new PlannedInvoice("cus_tz", -100, -85, List.of(new LineItem("Website maintenance (3 months)", 3, 12000)), 2000, 18, false,
                List.of(PlannedPayment.full(-86, "Bank Transfer", "IMPS-ICICI-772910"))));
        plan.add(new PlannedInvoice("cus_gm", -88, -73, List.of(new LineItem("Printed carry bags (bundle of 100)", 20, 600)), 0, 18, false,
                List.of(PlannedPayment.full(-74, "UPI", "UPI-411298765432"))));
        plan.add(new PlannedInvoice("cus_ravi", -80, -65, List.of(new LineItem("Electrical wiring – shop floor", 1, 8000)), 0, 18, false,
                List.of()));
        plan.add(new PlannedInvoice("cus_abc", -75, -60, List.of(new LineItem("Sona Masoori rice (25 kg bag)", 40, 1450)), 0, 5, false,
                List.of(PlannedPayment.full(-61, "Bank Transfer", "NEFT-SBI-118834"))));
        plan.add(new PlannedInvoice("cus_ravi", -62, -47, List.of(
                new LineItem("LED tube lights 20W", 50, 420),
                new LineItem("MCB switches 32A", 20, 380)), 0, 18, false,
                List.of(PlannedPayment.full(-44, "Cash", ""))));
        plan.add(new PlannedInvoice("cus_mt", -50, -35, List.of(new LineItem("Cotton fabric rolls", 8, 1500)), 0, 18, false,
                List.of()));
        plan.add(new PlannedInvoice("cus_mt", -46, -31, List.of(new LineItem("Tailoring & finishing charges", 1, 24000)), 0, 18, false,
                List.of(PlannedPayment.full(-30, "Bank Transfer", "RTGS-CANB-220913"))));
        plan.add(new PlannedInvoice("cus_cm", -40, -25, List.of(new LineItem("Annual vehicle servicing contract", 1, 36000)), 0, 18, false,
                List.of(PlannedPayment.full(-26, "Bank Transfer", "NEFT-AXIS-556201"))));
        plan.add(new PlannedInvoice("cus_ce", -32, -17, List.of(new LineItem("CCTV camera with installation", 6, 3000)), 0, 18, false,
                List.of(PlannedPayment.full(-14, "UPI", "UPI-424567890123"))));
        plan.add(new PlannedInvoice("cus_abc", -27, -12, List.of(new LineItem("Toor dal (50 kg bag)", 10, 2500)), 0, 18, false,
                List.of(new PlannedPayment(-18, 11500.0, "UPI", "UPI-426601234598"))));
        plan.add(new PlannedInvoice("cus_ka", -26, -11, List.of(new LineItem("Ergonomic office chairs", 8, 3000)), 0, 18, false,
                List.of(PlannedPayment.full(-9, "Bank Transfer", "NEFT-KVB-903311"))));
        plan.add(new PlannedInvoice("cus_xyz", -22, -7, List.of(new LineItem("Snack & beverage stock", 1, 10000)), 0, 18, false,
                List.of(new PlannedPayment(-15, 3300.0, "Cash", ""))));
        plan.add(new PlannedInvoice("cus_sls", -20, -5, List.of(new LineItem("Barcode scanners", 4, 4000)), 0, 18, false,
                List.of(PlannedPayment.full(-4, "UPI", "UPI-427788990011"))));
        plan.add(new PlannedInvoice("cus_ab", -18, -3, List.of(new LineItem("Commercial oven servicing", 1, 6500)), 0, 18, false,
                List.of()));
        plan.add(new PlannedInvoice("cus_tz", -10, 4, List.of(
                new LineItem("Cloud hosting – annual plan", 1, 25000),
                new LineItem("Website redesign", 1, 15000)), 2000, 18, false,
                List.of()));
        plan.add(new PlannedInvoice("cus_gm", -9, 6, List.of(new LineItem("Cold storage rack", 3, 6000)), 0, 18, false,
                List.of(new PlannedPayment(-2, 8000.0, "UPI", "UPI-428811223344"))));
        plan.add(new PlannedInvoice("cus_ce", -6, 9, List.of(new LineItem("Laptop – Dell Vostro 3520", 1, 30000)), 0, 18, false,
                List.of()));
        plan.add(new PlannedInvoice("cus_vh", -5, 2, List.of(new LineItem("Power tools rental (1 week)", 1, 6000)), 0, 18, false,
                List.of()));
        plan.add(new PlannedInvoice("cus_sls", -4, 12, List.of(new LineItem("Steel shelving units", 2, 5500)), 0, 18, false,
                List.of()));
        plan.add(new PlannedInvoice("cus_cm", -3, 18, List.of(new LineItem("Fleet GPS trackers", 10, 5000)), 0, 18, false,
                List.of()));
        plan.add(new PlannedInvoice("cus_ka", -2, 1, List.of(new LineItem("Courier charges – monthly", 1, 4200)), 0, 18, false,
                List.of()));
        plan.add(new PlannedInvoice("cus_ab", -1, 14, List.of(new LineItem("Glass display counter", 1, 18000)), 0, 18, true,
                List.of()));
        plan.add(new PlannedInvoice("cus_vh", 0, 15, List.of(new LineItem("Wall paint (20 L bucket)", 30, 450)), 0, 18, true,
                List.of()));
        return plan;
    }

    private static double round2(double n) {
        return Math.round(n * 100.0) / 100.0;
    }

    /** Clears everything and rebuilds the full sample dataset, dated relative to today. */
    @Transactional
    public void reseed() {
        clearTransactional();

        Long owner = CurrentUser.id();
        // Ids such as inv_1 are primary keys shared by all users. If another user already
        // holds them, this user's sample records get a "u<id>_" prefix so nothing collides.
        String idPrefix = customerRepository.existsById(SEED_CUSTOMERS[0][0]) ? "u" + owner + "_" : "";

        LocalDate today = LocalDate.now();

        java.util.Map<String, Customer> customersById = new java.util.HashMap<>();
        for (String[] c : SEED_CUSTOMERS) {
            Customer customer = new Customer(idPrefix + c[0]);
            customer.setOwnerId(owner);
            customer.setName(c[1]);
            customer.setContactPerson(c[2]);
            customer.setEmail(c[3]);
            customer.setPhone(c[4]);
            customer.setCity(c[5]);
            customer.setGstin(c[6]);
            customer.setCreatedAt(today.minusDays(180));
            customersById.put(c[0], customer);
        }
        customerRepository.saveAll(customersById.values());

        List<PlannedInvoice> plan = buildInvoicePlan();
        int payNo = 5001;
        int idx = 0;
        for (PlannedInvoice p : plan) {
            idx++;
            String id = idPrefix + "inv_" + idx;
            Customer customer = customersById.get(p.customerId());

            Invoice invoice = new Invoice();
            invoice.setId(id);
            invoice.setOwnerId(owner);
            invoice.setNumber("INV-" + (1000 + idx));
            invoice.setCustomer(customer);
            invoice.setCustomerEmail(customer.getEmail());
            invoice.setCustomerPhone(customer.getPhone());
            invoice.setIssueDate(today.plusDays(p.issueOffset()));
            invoice.setDueDate(today.plusDays(p.dueOffset()));
            invoice.setDiscountType("flat");
            invoice.setDiscountValue(BigDecimal.valueOf(p.discount()));
            invoice.setTaxRate(BigDecimal.valueOf(p.taxRate()));
            invoice.setNotes("Thank you for your business. Please pay by the due date.");
            invoice.setIsDraft(p.isDraft());
            invoice.setCreatedAt(today.plusDays(p.issueOffset()));

            List<InvoiceItem> items = new ArrayList<>();
            int j = 0;
            double subtotal = 0;
            for (LineItem li : p.items()) {
                InvoiceItem item = new InvoiceItem();
                item.setId(id + "_it" + j);
                item.setDescription(li.description());
                item.setQuantity(li.quantity());
                item.setUnitPrice(BigDecimal.valueOf(li.unitPrice()));
                item.setInvoice(invoice);
                items.add(item);
                subtotal += li.quantity() * li.unitPrice();
                j++;
            }
            invoice.setItems(items);
            invoiceRepository.save(invoice);

            double total = round2((subtotal - p.discount()) * (1 + p.taxRate() / 100.0));
            for (PlannedPayment pp : p.payments()) {
                Payment payment = new Payment();
                payment.setId(idPrefix + "pay_" + payNo);
                payment.setOwnerId(owner);
                payment.setNumber("PAY-" + payNo);
                payment.setInvoice(invoice);
                payment.setAmount(BigDecimal.valueOf(pp.amount() == null ? total : pp.amount()));
                payment.setMethod(pp.method());
                payment.setDate(today.plusDays(pp.offset()));
                payment.setReference(pp.reference());
                payment.setNote("");
                payment.setCreatedAt(today.plusDays(pp.offset()));
                paymentRepository.save(payment);
                payNo++;
            }
        }

        reminderRepository.save(reminder(idPrefix + "rem_1", idPrefix + "inv_6", owner, "Email", "firm", today.minusDays(20)));
        reminderRepository.save(reminder(idPrefix + "rem_2", idPrefix + "inv_9", owner, "WhatsApp", "firm", today.minusDays(8)));
        reminderRepository.save(reminder(idPrefix + "rem_3", idPrefix + "inv_13", owner, "WhatsApp", "friendly", today.minusDays(5)));

        Settings settings = settingsRepository.findById(owner).orElseGet(() -> {
            Settings created = new Settings();
            created.setId(owner);
            return created;
        });
        settings.setName("Sandeep Distributors");
        settings.setOwnerName("Sandeep Kumar");
        settings.setEmail("accounts@sandeepdistributors.in");
        settings.setPhone("98400 11223");
        settings.setAddress("No. 14, Usman Road, T. Nagar, Chennai 600017");
        settings.setGstin("33ABCPS1234K1Z5");
        settings.setUpiId("sandeepdist@okhdfc");
        settings.setInvoicePrefix("INV-");
        settings.setDefaultTaxRate(BigDecimal.valueOf(18));
        settings.setDefaultDueDays(15);
        settingsRepository.save(settings);
    }

    private Reminder reminder(String id, String invoiceId, Long owner, String channel, String tone, LocalDate date) {
        Reminder reminder = new Reminder();
        reminder.setId(id);
        reminder.setOwnerId(owner);
        reminder.setInvoice(invoiceRepository.findById(invoiceId).orElseThrow());
        reminder.setChannel(channel);
        reminder.setTone(tone);
        reminder.setDate(date);
        return reminder;
    }

    /** Wipes customers/invoices/payments/reminders, keeping settings (matches POST /api/system/clear). */
    @Transactional
    public void clearTransactional() {
        // Only the logged-in user's data is removed, never other users' records.
        Long owner = CurrentUser.id();
        reminderRepository.deleteAll(reminderRepository.findByOwnerId(owner));
        paymentRepository.deleteAll(paymentRepository.findByOwnerId(owner));
        invoiceRepository.deleteAll(invoiceRepository.findByOwnerId(owner));
        customerRepository.deleteAll(customerRepository.findByOwnerId(owner));
        // Run the deletes now and forget the deleted objects. Without this, reseeding
        // re-uses ids (inv_1, cus_ka...) that Hibernate still holds as "removed" in the
        // same transaction, which made POST /api/system/reset fail on a non-empty database.
        entityManager.flush();
        entityManager.clear();
    }
}
