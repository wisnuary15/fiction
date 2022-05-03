import fs from "fs"
import path from "path"
import dotenv from "dotenv"
import { expect, it, describe, beforeAll } from "vitest"
import Stripe from "stripe"
import { log } from "@factor/api"
import { factorStripe } from "@factor/site"

let customer: Stripe.Customer | Stripe.DeletedCustomer | undefined
let setupIntent: Stripe.SetupIntent | undefined
let subscription: Stripe.Subscription | undefined
const key = (): string => Math.random().toString().slice(2, 8)

//const testUtils: TestUtils | undefined = undefined

describe("stripe tests", () => {
  beforeAll(async () => {})

  it("has stripe test .env file", () => {
    const dirname = new URL(".", import.meta.url).pathname
    const p = path.resolve(dirname, ".env")
    const exists = fs.existsSync(p)

    expect(exists).toBeTruthy()

    if (!exists) {
      log.warn("stripeTests", "skipping stripe tests config missing")
    } else {
      dotenv.config({ path: p })
    }
  })

  it("creates a customer for new user", async () => {
    const { status, data } = await factorStripe.queries.ManageCustomer.serve(
      {
        customerId: "",
        _action: "retrieve",
      },
      { server: true },
    )

    expect(status).toBe("success")
    expect(data?.id).toBeTruthy()
    customer = data
  })

  it("gets the customer", async () => {
    const { status, data } = await factorStripe.queries.ManageCustomer.serve(
      {
        customerId: customer?.id,
        _action: "retrieve",
      },
      { server: true },
    )

    expect(status).toBe("success")
    expect(data?.id).toBeTruthy()
  })

  it("gets the refined customer in requests", async () => {
    const { status, data, customerData, customerId } =
      await factorStripe.queries.ManageCustomer.serveRequest(
        {
          customerId: customer?.id,
          _action: "retrieve",
        },
        { server: true },
      )

    expect(status).toBe("success")
    expect(data?.id).toBeTruthy()
    expect(customerId).toBe(data?.id)
    expect(customerData).toBeTruthy()
    expect(Object.keys(customerData ?? {}).length).toMatchInlineSnapshot("6")
  }, 12_000)

  it("adds a payment method", async () => {
    if (!customer?.id) throw new Error("customer required")

    const paymentMethod = await factorStripe
      .getServerClient()
      .paymentMethods.create({
        type: "card",
        card: {
          number: "4242424242424242",
          exp_month: 2,
          exp_year: 2023,
          cvc: "314",
        },
      })

    const result = await factorStripe.queries.ManagePaymentMethod.serve(
      {
        customerId: customer?.id,
        paymentMethodId: paymentMethod.id,
        _action: "create",
      },
      { server: true },
    )

    expect(result.status).toBe("success")
    expect(result.data?.data.length).toBeGreaterThan(0)
    expect(result.setupIntent).toBeTruthy()
    setupIntent = result.setupIntent
  })

  it("gets payment methods", async () => {
    if (!customer?.id) throw new Error("customer required")

    const result = await factorStripe.queries.ManagePaymentMethod.serve(
      {
        customerId: customer?.id,
        _action: "retrieve",
      },
      { server: true },
    )

    expect(result.status).toBe("success")
    expect(result.data?.data.length).toBeGreaterThan(0)
  })

  it("set the default payment method", async () => {
    if (!customer?.id) throw new Error("customer required")

    const customerData = (await factorStripe
      .getServerClient()
      .customers.retrieve(customer.id)) as Stripe.Customer

    expect(customerData).toBeTruthy()
    expect(customerData.invoice_settings.default_payment_method).toBe(
      setupIntent?.payment_method,
    )
  })

  it("creates a subscription", async () => {
    if (!customer?.id) throw new Error("customer required")

    const product = await factorStripe.getServerClient().products.create({
      name: "Gold Special",
    })

    const price = await factorStripe.getServerClient().prices.create({
      unit_amount: 50_000,
      currency: "usd",
      recurring: { interval: "month" },
      product: product.id,
    })

    const result = await factorStripe.queries.ManageSubscription.serve(
      {
        customerId: customer.id,
        _action: "create",
        priceId: price.id,
        idempotencyKey: key(),
      },
      { server: true },
    )

    expect(result.status).toBe("success")
    expect(result.data?.id).toContain("sub_")
    subscription = result.data
  })

  it("retrieves a subscription", async () => {
    if (!customer?.id) throw new Error("customer required")
    if (!subscription?.id) throw new Error("subscription required")

    const result = await factorStripe.queries.ManageSubscription.serve(
      {
        customerId: customer.id,
        _action: "retrieve",
        subscriptionId: subscription.id,
      },
      { server: true },
    )

    expect(result.status).toBe("success")
    expect(result.data?.id).toContain("sub_")
  })

  it("deletes a subscription", async () => {
    if (!customer?.id) throw new Error("customer required")
    if (!subscription?.id) throw new Error("subscription required")

    const result = await factorStripe.queries.ManageSubscription.serve(
      {
        customerId: customer.id,
        _action: "delete",
        subscriptionId: subscription.id,
      },
      { server: true },
    )

    expect(result.status).toBe("success")
  })

  it("gets the coupon", async () => {
    if (!customer?.id) throw new Error("customer required")
    if (!subscription?.id) throw new Error("subscription required")

    const couponId = `TEST_COUPON_${key()}`

    const coupon = await factorStripe.getServerClient().coupons.create({
      percent_off: 50,
      id: couponId,
    })

    const result = await factorStripe.queries.GetCoupon.serve(
      {
        couponCode: coupon.id,
      },
      { server: true },
    )

    expect(result.status).toBe("success")
    expect(result.data?.id).toContain("TEST_COUPON")
  })

  it("get invoices", async () => {
    if (!customer?.id) throw new Error("customer required")
    if (!subscription?.id) throw new Error("subscription required")

    const result = await factorStripe.queries.GetInvoices.serve(
      {
        customerId: customer.id,
      },
      { server: true },
    )

    expect(result.status).toBe("success")
    expect(result.data?.data.length).toBeGreaterThan(0)
  })

  // it("create new user", async () => {
  //   const response = await userEngine.Queries.ManageUser.serve(
  //     {
  //       _action: "create",
  //       fields: { email: `arpowers+${key}@gmail.com`, fullName: "test" },
  //     },
  //     undefined,
  //   )

  //   if (!response.data) throw new Error("problem creating user")

  //   user = response.data

  //   expect(user?.userId).toBeTruthy()
  //   expect(user?.fullName).toBe("test")
  //   expect(user?.verificationCode).toBeTruthy()
  // })
})