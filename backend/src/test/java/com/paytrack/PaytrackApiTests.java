package com.paytrack;

import com.jayway.jsonpath.JsonPath;
import com.paytrack.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End to end tests: real Spring context, real (in-memory) database, real HTTP
 * layer through MockMvc. The demo data is re-seeded before every test.
 *
 * Seed facts used below (see SeedService): inv_1 is fully paid, inv_6 is
 * overdue with no payment, inv_19 is partially paid but not yet due,
 * inv_25 is a draft, cus_ce owns several invoices.
 */
@SpringBootTest
@AutoConfigureMockMvc
class PaytrackApiTests {

    @Autowired
    MockMvc mvc;

    @Autowired
    UserRepository userRepository;

    /** Token of the main test user, who owns the sample data (ids inv_1, cus_abc ...). */
    private String token;

    @BeforeEach
    void loginAndResetDemoData() throws Exception {
        String credentials = "{\"name\":\"Tester\",\"email\":\"tester@paytrack.test\",\"password\":\"secret123\"}";
        MvcResult result = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(credentials))
                .andReturn();
        if (result.getResponse().getStatus() == 409) { // already registered by an earlier test
            result = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"tester@paytrack.test\",\"password\":\"secret123\"}")).andReturn();
        }
        token = JsonPath.read(result.getResponse().getContentAsString(), "$.token");
        mvc.perform(apost("/api/system/reset")).andExpect(status().isOk());
    }

    // Request builders that already carry the main user's login token.
    private MockHttpServletRequestBuilder aget(String path) { return get(path).header("Authorization", "Bearer " + token); }
    private MockHttpServletRequestBuilder apost(String path) { return post(path).header("Authorization", "Bearer " + token); }
    private MockHttpServletRequestBuilder adelete(String path) { return delete(path).header("Authorization", "Bearer " + token); }

    /** Registers a brand new user and returns their token. */
    private String newUserToken() throws Exception {
        String email = "user" + UUID.randomUUID() + "@paytrack.test";
        MvcResult r = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Other\",\"email\":\"" + email + "\",\"password\":\"secret123\"}"))
                .andExpect(status().isCreated()).andReturn();
        return JsonPath.read(r.getResponse().getContentAsString(), "$.token");
    }

    @Test
    void healthEndpointIsUp() throws Exception {
        mvc.perform(aget("/api/health")).andExpect(status().isOk()).andExpect(jsonPath("$.ok").value(true));
    }

    @Test
    void seedHas12CustomersAnd26Invoices() throws Exception {
        mvc.perform(aget("/api/bootstrap"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.customers.length()").value(12))
                .andExpect(jsonPath("$.invoices.length()").value(26));
    }

    @Test
    void paymentLargerThanBalanceIsRejected() throws Exception {
        mvc.perform(apost("/api/payments").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"id\":\"pay_x\",\"invoiceId\":\"inv_1\",\"amount\":1,\"method\":\"Cash\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void validPartialPaymentIsAccepted() throws Exception {
        mvc.perform(apost("/api/payments").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"id\":\"pay_ok\",\"invoiceId\":\"inv_6\",\"amount\":1000,\"method\":\"UPI\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.invoiceId").value("inv_6"));
    }

    @Test
    void paymentOnDraftInvoiceIsRejected() throws Exception {
        mvc.perform(apost("/api/payments").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"id\":\"pay_d\",\"invoiceId\":\"inv_25\",\"amount\":100,\"method\":\"Cash\"}"))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void invoiceStatusesAreDerivedCorrectly() throws Exception {
        mvc.perform(aget("/api/invoices/inv_1/summary")).andExpect(jsonPath("$.status").value("Paid"));
        mvc.perform(aget("/api/invoices/inv_6/summary")).andExpect(jsonPath("$.status").value("Overdue"));
        mvc.perform(aget("/api/invoices/inv_19/summary")).andExpect(jsonPath("$.status").value("Partially Paid"));
        mvc.perform(aget("/api/invoices/inv_25/summary")).andExpect(jsonPath("$.status").value("Draft"));
    }

    @Test
    void searchFiltersByStatusAndText() throws Exception {
        mvc.perform(aget("/api/invoices/search").param("status", "Overdue"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("Overdue"));
        mvc.perform(aget("/api/invoices/search").param("q", "madurai"))
                .andExpect(jsonPath("$[0].customerName").value("Madurai Textiles"));
        mvc.perform(aget("/api/invoices/search").param("status", "Nonsense"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void dashboardNumbersAddUp() throws Exception {
        String body = mvc.perform(aget("/api/dashboard")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        double invoiced = ((Number) JsonPath.read(body, "$.totalInvoiced")).doubleValue();
        double collected = ((Number) JsonPath.read(body, "$.totalCollected")).doubleValue();
        double outstanding = ((Number) JsonPath.read(body, "$.outstanding")).doubleValue();
        assertTrue(invoiced > 0);
        assertEquals(invoiced, collected + outstanding, 0.01);
    }

    @Test
    void nextInvoiceNumberContinuesTheSequence() throws Exception {
        mvc.perform(aget("/api/invoices/next-number")).andExpect(jsonPath("$.number").value("INV-1027"));
    }

    @Test
    void duplicateInvoiceNumberIsRejected() throws Exception {
        mvc.perform(apost("/api/invoices").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"id\":\"inv_new\",\"number\":\"INV-1001\",\"customerId\":\"cus_abc\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void customerWithInvoicesCannotBeDeleted() throws Exception {
        mvc.perform(adelete("/api/customers/cus_ce")).andExpect(status().isConflict());
    }

    @Test
    void customerNameAndGstinAreValidated() throws Exception {
        mvc.perform(apost("/api/customers").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"id\":\"c1\",\"name\":\"\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(apost("/api/customers").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"id\":\"c2\",\"name\":\"Test Co\",\"gstin\":\"BAD\"}"))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void malformedJsonGivesCleanBadRequest() throws Exception {
        mvc.perform(apost("/api/customers").contentType(MediaType.APPLICATION_JSON).content("{not json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void upiLinkAndReminderMessageAreGenerated() throws Exception {
        mvc.perform(aget("/api/invoices/inv_6/upi-link"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.link").value(org.hamcrest.Matchers.startsWith("upi://pay?pa=")));
        mvc.perform(aget("/api/invoices/inv_6/reminder-message").param("channel", "WhatsApp"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tone").value("final"))
                .andExpect(jsonPath("$.link").value(org.hamcrest.Matchers.startsWith("https://wa.me/91")));
        mvc.perform(aget("/api/invoices/inv_1/reminder-message")).andExpect(status().isUnprocessableEntity());
    }

    @Test
    void reminderSuggestionsListOverdueInvoices() throws Exception {
        mvc.perform(aget("/api/reminders/suggestions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].invoice.status").value("Overdue"));
    }

    @Test
    void customerStatementTotalsMatch() throws Exception {
        String body = mvc.perform(aget("/api/customers/cus_mt/statement")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        double billed = ((Number) JsonPath.read(body, "$.totalBilled")).doubleValue();
        double paid = ((Number) JsonPath.read(body, "$.totalPaid")).doubleValue();
        double outstanding = ((Number) JsonPath.read(body, "$.outstanding")).doubleValue();
        assertEquals(billed, paid + outstanding, 0.01);
    }

    @Test
    void csvAndPrintExportsWork() throws Exception {
        mvc.perform(aget("/api/export/invoices.csv"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.startsWith("Invoice No,Customer")));
        mvc.perform(aget("/api/export/payments.csv")).andExpect(status().isOk());
        mvc.perform(aget("/api/invoices/inv_1/print"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("INV-1001")));
    }

    // ---------------------------------------------------------------- login and register

    @Test
    void apiRejectsRequestsWithoutAToken() throws Exception {
        mvc.perform(get("/api/bootstrap")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").exists());
        mvc.perform(get("/api/bootstrap").header("Authorization", "Bearer not.a.token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void registerChecksItsInput() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"A\",\"email\":\"not-an-email\",\"password\":\"secret123\"}"))
                .andExpect(status().isUnprocessableEntity());
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"A\",\"email\":\"a@b.co\",\"password\":\"123\"}"))
                .andExpect(status().isUnprocessableEntity());
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Dup\",\"email\":\"TESTER@paytrack.test\",\"password\":\"secret123\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void loginWorksAndWrongPasswordIsRefused() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"tester@paytrack.test\",\"password\":\"secret123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.user.email").value("tester@paytrack.test"))
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"tester@paytrack.test\",\"password\":\"wrong-password\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nobody@paytrack.test\",\"password\":\"secret123\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void meReturnsTheLoggedInUser() throws Exception {
        mvc.perform(aget("/api/auth/me")).andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("tester@paytrack.test"));
    }

    @Test
    void tamperedTokenIsRejected() throws Exception {
        String forged = token.substring(0, token.length() - 3) + (token.endsWith("abc") ? "xyz" : "abc");
        mvc.perform(get("/api/bootstrap").header("Authorization", "Bearer " + forged))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void passwordsAreStoredHashedNeverAsText() throws Exception {
        String stored = userRepository.findByEmail("tester@paytrack.test").orElseThrow().getPasswordHash();
        assertTrue(stored.startsWith("pbkdf2$"));
        assertTrue(!stored.contains("secret123"));
    }

    @Test
    void downloadLinksCanCarryTheTokenInTheUrl() throws Exception {
        mvc.perform(get("/api/export/invoices.csv").param("access_token", token)).andExpect(status().isOk());
    }

    @Test
    void usersCannotSeeOrTouchEachOthersData() throws Exception {
        String other = "Bearer " + newUserToken();
        // A new account starts empty...
        mvc.perform(get("/api/bootstrap").header("Authorization", other))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.customers.length()").value(0))
                .andExpect(jsonPath("$.invoices.length()").value(0));
        // ...cannot read the main user's records...
        mvc.perform(get("/api/invoices/inv_1/summary").header("Authorization", other)).andExpect(status().isNotFound());
        mvc.perform(get("/api/invoices/search").header("Authorization", other)).andExpect(jsonPath("$.length()").value(0));
        // ...cannot overwrite them by re-using an id...
        mvc.perform(post("/api/customers").header("Authorization", other).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"id\":\"cus_abc\",\"name\":\"Hijack\"}"))
                .andExpect(status().isConflict());
        // ...cannot pay or delete them...
        mvc.perform(post("/api/payments").header("Authorization", other).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"id\":\"pay_h\",\"invoiceId\":\"inv_6\",\"amount\":10,\"method\":\"Cash\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(delete("/api/customers/cus_abc").header("Authorization", other)).andExpect(status().isNotFound());
        // ...and the main user's data is untouched.
        mvc.perform(aget("/api/bootstrap")).andExpect(jsonPath("$.customers.length()").value(12));
    }

    // ---------------------------------------------------------------- administrator

    /** Logs in as the built in administrator (created at startup) and returns the whole auth answer as JSON text. */
    private String adminSession() throws Exception {
        return mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@paytrack.test\",\"password\":\"secret123\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
    }

    private String adminHeader() throws Exception {
        return "Bearer " + JsonPath.<String>read(adminSession(), "$.token");
    }

    /** Registers a brand new normal user and returns the auth answer as JSON text. */
    private String newUserSession() throws Exception {
        String email = "user" + UUID.randomUUID() + "@paytrack.test";
        return mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Other\",\"email\":\"" + email + "\",\"password\":\"secret123\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
    }

    @Test
    void adminCannotResetOrClearDemoData() throws Exception {
        String admin = adminHeader();
        mvc.perform(post("/api/system/reset").header("Authorization", admin)).andExpect(status().isForbidden());
        mvc.perform(post("/api/system/clear").header("Authorization", admin)).andExpect(status().isForbidden());
    }

    @Test
    void adminCanCreateAUserAndResetTheirPassword() throws Exception {
        String admin = adminHeader();
        String email = "made" + UUID.randomUUID() + "@paytrack.test";
        MvcResult created = mvc.perform(post("/api/admin/users").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Made\",\"email\":\"" + email + "\",\"password\":\"temp123\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.role").value("USER")).andReturn();
        int id = JsonPath.read(created.getResponse().getContentAsString(), "$.id");
        mvc.perform(post("/api/admin/users").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Made\",\"email\":\"" + email + "\",\"password\":\"temp123\"}"))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"temp123\"}")).andExpect(status().isOk());
        mvc.perform(post("/api/admin/users/" + id + "/password").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"12\"}")).andExpect(status().isUnprocessableEntity());
        mvc.perform(post("/api/admin/users/" + id + "/password").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"fresh456\"}")).andExpect(status().isNoContent());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"temp123\"}")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"fresh456\"}")).andExpect(status().isOk());
    }

    @Test
    void adminActivityLogRecordsActionsAndIsAdminOnly() throws Exception {
        String admin = adminHeader();
        String email = "log" + UUID.randomUUID() + "@paytrack.test";
        mvc.perform(post("/api/admin/users").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Logged\",\"email\":\"" + email + "\",\"password\":\"temp123\"}")).andExpect(status().isCreated());
        mvc.perform(get("/api/admin/activity").header("Authorization", admin))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].action").value("CREATE_USER"));
        mvc.perform(aget("/api/admin/activity")).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/overview").header("Authorization", admin))
                .andExpect(jsonPath("$.totalCollected").exists()).andExpect(jsonPath("$.newUsersLast7Days").exists());
    }

    @Test
    void adminEndpointsAreForbiddenForNormalUsers() throws Exception {
        mvc.perform(aget("/api/admin/users")).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").exists());
        mvc.perform(get("/api/admin/overview")).andExpect(status().isUnauthorized());
    }

    @Test
    void theBuiltInAdminExistsAndNobodyCanRegisterAsAdmin() throws Exception {
        String session = adminSession();
        assertEquals("ADMIN", JsonPath.read(session, "$.user.role"));
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Fake\",\"email\":\"admin@paytrack.test\",\"password\":\"secret123\"}"))
                .andExpect(status().isConflict());
        mvc.perform(aget("/api/auth/me")).andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void adminSeesAccountsAndCountsOnly() throws Exception {
        String admin = adminHeader();
        mvc.perform(get("/api/admin/overview").header("Authorization", admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users").value(org.hamcrest.Matchers.greaterThanOrEqualTo(2)));
        mvc.perform(get("/api/admin/users").header("Authorization", admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.email=='tester@paytrack.test')].customers").value(12))
                .andExpect(jsonPath("$[0].passwordHash").doesNotExist());
    }

    @Test
    void adminCanDisableAndEnableAnAccount() throws Exception {
        String admin = adminHeader();
        String session = newUserSession();
        int id = JsonPath.read(session, "$.user.id");
        String userToken = JsonPath.read(session, "$.token");
        String email = JsonPath.read(session, "$.user.email");

        mvc.perform(patch("/api/admin/users/" + id).header("Authorization", admin)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"active\":false}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.active").value(false));
        // The disabled user's old token stops working and a new login is refused.
        mvc.perform(get("/api/bootstrap").header("Authorization", "Bearer " + userToken)).andExpect(status().isForbidden());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"secret123\"}"))
                .andExpect(status().isForbidden());

        mvc.perform(patch("/api/admin/users/" + id).header("Authorization", admin)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"active\":true}"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/bootstrap").header("Authorization", "Bearer " + userToken)).andExpect(status().isOk());
    }

    @Test
    void adminCanDeleteAnAccountButNotThemselves() throws Exception {
        String admin = adminHeader();
        String session = newUserSession();
        int id = JsonPath.read(session, "$.user.id");
        String email = JsonPath.read(session, "$.user.email");

        mvc.perform(delete("/api/admin/users/" + id).header("Authorization", admin)).andExpect(status().isNoContent());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"secret123\"}"))
                .andExpect(status().isUnauthorized());

        int adminId = JsonPath.read(adminSession(), "$.user.id");
        mvc.perform(patch("/api/admin/users/" + adminId).header("Authorization", admin)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"active\":false}"))
                .andExpect(status().isUnprocessableEntity());
        mvc.perform(delete("/api/admin/users/" + adminId).header("Authorization", admin))
                .andExpect(status().isUnprocessableEntity());
    }
}
