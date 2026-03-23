import * as React from "react"
import { PageShell } from "@/components/layouts/page-shell"
import { PageHeader } from "@/components/blocks/page-header"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { useData, canAccess } from "@/context/DataContext"
import type { Customer, ShippingAddress } from "@/lib/gaama-types"
import { Plus, Users, Mail, Phone, Search, Eye, Pencil, Download, MapPin, FileText, Info, Trash2, Upload } from "lucide-react"
import { PageHeaderWithBack } from "@/components/patterns/page-header-with-back"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cityOptionsForState } from "@/data/indian-state-cities"
import { latestOfDates, sortLatestFirst } from "@/lib/utils"

const INDUSTRY_TYPES = [
  "Retail",
  "Healthcare",
  "Manufacturing",
  "Technology",
  "Food & Beverage",
  "Pharma",
]

const CHANNEL_TYPES = ["Direct", "Distributor", "Retailer", "Online", "Wholesale"]

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
]

type ModalMode = "view" | null

interface ShippingAddressForm {
  id: string
  address: string
  state: string
  city: string
  pincode: string
  country: string
}

const defaultShippingAddress = (id: string): ShippingAddressForm => ({
  id,
  address: "",
  state: "",
  city: "",
  pincode: "",
  country: "India",
})

function generateCustomerCode(customers: Customer[]): string {
  const next = (customers.length + 1).toString().padStart(3, "0")
  return `CUS${next}`
}

export function CustomersPage() {
  const data = useData()
  const [mode, setMode] = React.useState<ModalMode>(null)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  // Multi-step Add Customer state
  const [showAddForm, setShowAddForm] = React.useState(false)
  const [currentStep, setCurrentStep] = React.useState(1)
  const [customerCode, setCustomerCode] = React.useState("")
  const [customerName, setCustomerName] = React.useState("")
  const [customerType, setCustomerType] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [mobileNumber, setMobileNumber] = React.useState("")
  const [alternateMobileNumber, setAlternateMobileNumber] = React.useState("")
  const [website, setWebsite] = React.useState("")
  const [industryType, setIndustryType] = React.useState("")
  const [channelType, setChannelType] = React.useState("")
  const [contactPerson, setContactPerson] = React.useState("")
  const [billingAddress, setBillingAddress] = React.useState("")
  const [state, setState] = React.useState("")
  const [city, setCity] = React.useState("")
  const [pincode, setPincode] = React.useState("")
  const [country, setCountry] = React.useState("India")
  const [shippingAddresses, setShippingAddresses] = React.useState<ShippingAddressForm[]>(() => [
    defaultShippingAddress("1"),
  ])
  const [gstNumber, setGstNumber] = React.useState("")
  const [panNumber, setPanNumber] = React.useState("")
  const [gstRegistrationType, setGstRegistrationType] = React.useState("")
  const [stateCode, setStateCode] = React.useState("")
  const [taxFilingFrequency, setTaxFilingFrequency] = React.useState("")
  const [paymentTerms, setPaymentTerms] = React.useState("Net 30 Days")
  const [creditLimit, setCreditLimit] = React.useState("")
  const [openingBalance, setOpeningBalance] = React.useState("")
  const [bankName, setBankName] = React.useState("")
  const [accountNumber, setAccountNumber] = React.useState("")
  const [ifsc, setIfsc] = React.useState("")
  const [kycDocument, setKycDocument] = React.useState("")
  const [tradeLicenseNumber, setTradeLicenseNumber] = React.useState("")
  const [iecCode, setIecCode] = React.useState("")
  const [msmeRegistration, setMsmeRegistration] = React.useState("")
  const [supportingDocuments, setSupportingDocuments] = React.useState("")
  const supportingDocsInputRef = React.useRef<HTMLInputElement>(null)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [showEditForm, setShowEditForm] = React.useState(false)
  const [editId, setEditId] = React.useState<string | null>(null)
  const [industryFilter, setIndustryFilter] = React.useState("all")
  const [cityFilter, setCityFilter] = React.useState("all")

  const allowed = canAccess(data.currentRole, "customers")
  const customers = data.customers

  React.useEffect(() => {
    if (showAddForm && customerCode === "") {
      setCustomerCode(generateCustomerCode(customers))
    }
  }, [showAddForm, customers.length, customerCode])

  const handleAddNew = () => {
    setCustomerCode(generateCustomerCode(customers))
    setCustomerName("")
    setCustomerType("")
    setEmail("")
    setMobileNumber("")
    setAlternateMobileNumber("")
    setWebsite("")
    setIndustryType("")
    setChannelType("")
    setContactPerson("")
    setBillingAddress("")
    setState("")
    setCity("")
    setPincode("")
    setCountry("India")
    setShippingAddresses([defaultShippingAddress("1")])
    setGstNumber("")
    setPanNumber("")
    setGstRegistrationType("")
    setStateCode("")
    setTaxFilingFrequency("")
    setPaymentTerms("Net 30 Days")
    setCreditLimit("")
    setOpeningBalance("")
    setBankName("")
    setAccountNumber("")
    setIfsc("")
    setKycDocument("")
    setTradeLicenseNumber("")
    setIecCode("")
    setMsmeRegistration("")
    setSupportingDocuments("")
    if (supportingDocsInputRef.current) supportingDocsInputRef.current.value = ""
    setCurrentStep(1)
    setShowAddForm(true)
  }

  const handleAddShippingAddress = () => {
    setShippingAddresses((prev) => [
      ...prev,
      defaultShippingAddress(String(Date.now())),
    ])
  }

  const handleRemoveShippingAddress = (id: string) => {
    if (shippingAddresses.length > 1) {
      setShippingAddresses((prev) => prev.filter((a) => a.id !== id))
    }
  }

  const handleShippingAddressChange = (
    id: string,
    field: keyof ShippingAddressForm,
    value: string
  ) => {
    setShippingAddresses((prev) =>
      prev.map((addr) => {
        if (addr.id !== id) return addr
        const next = { ...addr, [field]: value }
        if (field === "state") next.city = ""
        return next
      })
    )
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (
        !customerName ||
        !email ||
        !mobileNumber ||
        !customerType ||
        !industryType ||
        !channelType
      ) {
        alert("Please fill all required fields in Basic Customer Information")
        return
      }
    }
    if (currentStep === 2) {
      if (!billingAddress || !state || !city || !pincode || !country) {
        alert("Please fill all required fields in Address Details")
        return
      }
      for (const addr of shippingAddresses) {
        if (!addr.address || !addr.state || !addr.city || !addr.pincode) {
          alert("Please fill all shipping address fields")
          return
        }
      }
    }
    if (currentStep < 4) {
      setCurrentStep((s) => s + 1)
    } else {
      const shippingAddressesTyped: ShippingAddress[] = shippingAddresses.map(
        (addr, i) => ({
          id: addr.id,
          address: `${addr.address}, ${addr.city}, ${addr.state} - ${addr.pincode}`,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          is_default: i === 0,
        })
      )
      const billingFull = `${billingAddress}, ${city}, ${state} - ${pincode}`
      const payload = {
        customer_name: customerName,
        company_name: customerName,
        email,
        phone: mobileNumber,
        billing_address: billingFull,
        shipping_addresses: shippingAddressesTyped.map(
          (a) => `${a.address}${a.city ? ` ${a.city}` : ""}`
        ),
        shipping_addresses_typed: shippingAddressesTyped,
        gst_number: gstNumber || "",
        status: "active" as const,
        terms_of_delivery: paymentTerms || "Net 30 Days",
        pan_number: panNumber,
        contact_person: contactPerson || customerName,
        customer_code: customerCode,
        customer_type: customerType,
        website: website,
        industry_type: industryType,
        city,
        state,
        pincode,
        kyc_document: kycDocument || "N/A",
        trade_license_number: tradeLicenseNumber || undefined,
        iec_code: iecCode || undefined,
        msme_registration: msmeRegistration || undefined,
        supporting_documents: supportingDocuments || undefined,
        gst_registration_type: gstRegistrationType || undefined,
        state_code: stateCode || undefined,
        tax_filing_frequency: taxFilingFrequency || undefined,
        payment_terms: paymentTerms || undefined,
        credit_limit: creditLimit || undefined,
        opening_balance: openingBalance || undefined,
        bank_name: bankName || undefined,
        account_number: accountNumber || undefined,
        ifsc: ifsc || undefined,
      }
      if (showEditForm && editId) {
        data.updateCustomer(editId, payload)
        setShowEditForm(false)
        setEditId(null)
        setCurrentStep(1)
        toast.success("Customer updated.")
      } else {
        data.addCustomer(payload)
        setShowAddForm(false)
        setCurrentStep(1)
        toast.success("Customer added.")
      }
    }
  }

  const handlePrevious = () => {
    setCurrentStep((s) => (s > 1 ? s - 1 : s))
  }

  const handleCancelAdd = () => {
    if (!window.confirm("Discard changes?")) return
    setShowAddForm(false)
    setCurrentStep(1)
  }

  const openEdit = (c: Customer) => {
    setCustomerCode(c.customer_code ?? c.customer_id)
    setCustomerName(c.customer_name)
    setCustomerType(c.customer_type ?? "")
    setEmail(c.email)
    setMobileNumber(c.phone)
    setAlternateMobileNumber("")
    setWebsite(c.website ?? "")
    setIndustryType(c.industry_type ?? "")
    setChannelType("")
    setContactPerson(c.contact_person ?? "")
    setBillingAddress(c.billing_address)
    setState(c.state ?? "")
    setCity(c.city ?? "")
    setPincode(c.pincode ?? "")
    setCountry("India")
    const typed = c.shipping_addresses_typed
    if (typed?.length) {
      setShippingAddresses(
        typed.map((a) => ({
          id: a.id,
          address: a.address ?? "",
          state: a.state ?? "",
          city: a.city ?? "",
          pincode: a.pincode ?? "",
          country: "India",
        }))
      )
    } else {
      setShippingAddresses([defaultShippingAddress("1")])
    }
    setGstNumber(c.gst_number ?? "")
    setPanNumber(c.pan_number ?? "")
    setGstRegistrationType(c.gst_registration_type ?? "")
    setStateCode(c.state_code ?? "")
    setTaxFilingFrequency(c.tax_filing_frequency ?? "")
    setPaymentTerms(c.payment_terms ?? "Net 30 Days")
    setCreditLimit(c.credit_limit ?? "")
    setOpeningBalance(c.opening_balance ?? "")
    setBankName(c.bank_name ?? "")
    setAccountNumber(c.account_number ?? "")
    setIfsc(c.ifsc ?? "")
    setKycDocument(c.kyc_document ?? "")
    setTradeLicenseNumber(c.trade_license_number ?? "")
    setIecCode(c.iec_code ?? "")
    setMsmeRegistration(c.msme_registration ?? "")
    setSupportingDocuments(c.supporting_documents ?? "")
    setCurrentStep(1)
    setEditId(c.customer_id)
    setShowEditForm(true)
  }

  const handleCancelEdit = () => {
    if (!window.confirm("Discard changes?")) return
    setShowEditForm(false)
    setEditId(null)
  }

  const handleSaveEdit = () => {
    if (!editId) return
    const shippingAddressesTyped: ShippingAddress[] = shippingAddresses.map((addr, i) => ({
      id: addr.id,
      address: `${addr.address}, ${addr.city}, ${addr.state} - ${addr.pincode}`,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      is_default: i === 0,
    }))
    const billingFull = `${billingAddress}, ${city}, ${state} - ${pincode}`
    data.updateCustomer(editId, {
      customer_name: customerName,
      company_name: customerName,
      email,
      phone: mobileNumber,
      billing_address: billingFull,
      shipping_addresses: shippingAddressesTyped.map((a) => a.address),
      shipping_addresses_typed: shippingAddressesTyped,
      gst_number: gstNumber || "",
      terms_of_delivery: paymentTerms || "Net 30 Days",
      pan_number: panNumber,
      contact_person: contactPerson || customerName,
      customer_code: customerCode,
      customer_type: customerType,
      website: website,
      industry_type: industryType,
      city,
      state,
      pincode,
      kyc_document: kycDocument || "N/A",
      trade_license_number: tradeLicenseNumber || undefined,
      iec_code: iecCode || undefined,
      msme_registration: msmeRegistration || undefined,
      supporting_documents: supportingDocuments || undefined,
      gst_registration_type: gstRegistrationType || undefined,
      state_code: stateCode || undefined,
      tax_filing_frequency: taxFilingFrequency || undefined,
      payment_terms: paymentTerms || undefined,
      credit_limit: creditLimit || undefined,
      opening_balance: openingBalance || undefined,
      bank_name: bankName || undefined,
      account_number: accountNumber || undefined,
      ifsc: ifsc || undefined,
    })
    setShowEditForm(false)
    setEditId(null)
    setCurrentStep(1)
    toast.success("Customer updated.")
  }

  const setDefaultShippingAddress = (id: string) => {
    setShippingAddresses((prev) => {
      const idx = prev.findIndex((a) => a.id === id)
      if (idx <= 0) return prev
      const next = [...prev]
      const [item] = next.splice(idx, 1)
      next.unshift(item)
      return next
    })
  }

  const openView = (c: Customer) => {
    setSelectedId(c.customer_id)
    setMode("view")
  }

  const filteredCustomers = React.useMemo(() => {
    const term = searchTerm.toLowerCase()
    const list = customers.filter((c) => {
      const matchSearch =
        (c.customer_name ?? "").toLowerCase().includes(term) ||
        (c.email ?? "").toLowerCase().includes(term) ||
        (c.phone ?? "").toLowerCase().includes(term) ||
        (c.contact_person ?? "").toLowerCase().includes(term)
      const matchIndustry =
        industryFilter === "all" || (c.industry_type ?? "") === industryFilter
      const matchCity =
        cityFilter === "all" ||
        (c.billing_address ?? "").toLowerCase().includes(cityFilter.toLowerCase())
      return matchSearch && matchIndustry && matchCity
    })
    return sortLatestFirst(
      list,
      (c) => latestOfDates(c.updated_at, c.created_at),
      (c) => c.customer_id
    )
  }, [customers, searchTerm, industryFilter, cityFilter])
  const uniqueCities = Array.from(
    new Set(
      customers
        .map((c) => {
          const parts = (c.billing_address ?? "").split(",")
          return parts.length >= 2 ? parts[1].trim().split(" ")[0] : ""
        })
        .filter(Boolean)
    )
  )

  // 3-step Edit Customer form (per Pencil designs FNhZb, OtzkT, N9u2V)
  if (showEditForm && editId && allowed) {
    const stepsEdit = [
      { num: 1, title: "Basic Info" },
      { num: 2, title: "Address" },
      { num: 3, title: "Tax & Legal" },
    ]
    return (
      <PageShell>
        <div className="flex-1 overflow-auto">
          <div className="w-full h-full">
            <PageHeaderWithBack title="Edit Customer" noBorder backButton={{ onClick: handleCancelEdit }} />
            <div className="space-y-4 px-6 py-4 h-full">
          {/* Stepper */}
          <div className="flex items-center gap-0">
            {stepsEdit.map((step, index) => (
              <React.Fragment key={step.num}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(step.num)}
                  className="flex items-center gap-2 hover:opacity-80"
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      currentStep === step.num
                        ? "bg-primary text-primary-foreground"
                        : currentStep > step.num
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.num ? "✓" : step.num}
                  </div>
                  <span className={currentStep >= step.num ? "text-foreground font-medium" : "text-muted-foreground"}>
                    {step.title}
                  </span>
                </button>
                {index < stepsEdit.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 min-w-[40px] ${currentStep > step.num ? "bg-primary" : "bg-muted"}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-6">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Customer Code</Label>
                  <Input value={customerCode} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Customer Type *</Label>
                  <Select value={customerType} onValueChange={setCustomerType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="Company">Company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Customer Name *</Label>
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="Phone" />
                </div>
                <div className="space-y-2">
                  <Label>Contact Person</Label>
                  <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Contact person" />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Website" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Industry Type</Label>
                  <Select value={industryType} onValueChange={setIndustryType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRY_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Address Information */}
          {currentStep === 2 && (
            <div className="rounded-lg border border-border bg-card p-6 space-y-6">
              <h2 className="text-lg font-semibold">Address Information</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Billing Address *</Label>
                  <Textarea value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} placeholder="Enter billing address" className="min-h-[80px]" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>State *</Label>
                    <Select
                      value={state}
                      onValueChange={(v) => {
                        setState(v)
                        setCity("")
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>City *</Label>
                    <Select value={city || undefined} onValueChange={setCity} disabled={!state}>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={state ? "Select city" : "Select state first"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {cityOptionsForState(state, city).map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Pincode *</Label>
                    <Input value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="000000" />
                  </div>
                </div>
              </div>
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Shipping Addresses</h3>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddShippingAddress}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Address
                  </Button>
                </div>
                <div className="space-y-4">
                  {shippingAddresses.map((addr, index) => (
                    <div key={addr.id} className="rounded-lg border bg-muted/30 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-sm">Shipping Address {index + 1}</span>
                        <div className="flex items-center gap-2">
                          {index === 0 ? (
                            <Badge variant="secondary">Default</Badge>
                          ) : (
                            <button
                              type="button"
                              className="text-sm text-primary hover:underline"
                              onClick={() => setDefaultShippingAddress(addr.id)}
                            >
                              Set as Default
                            </button>
                          )}
                          {shippingAddresses.length > 1 && (
                            <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleRemoveShippingAddress(addr.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                          <Label>Address</Label>
                          <Textarea value={addr.address} onChange={(e) => handleShippingAddressChange(addr.id, "address", e.target.value)} placeholder="Address" className="min-h-[60px]" />
                        </div>
                        <div className="space-y-2">
                          <Label>State</Label>
                          <Select value={addr.state} onValueChange={(v) => handleShippingAddressChange(addr.id, "state", v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                              {INDIAN_STATES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>City</Label>
                          <Select
                            value={addr.city || undefined}
                            onValueChange={(v) => handleShippingAddressChange(addr.id, "city", v)}
                            disabled={!addr.state}
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={addr.state ? "Select city" : "Select state first"}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {cityOptionsForState(addr.state, addr.city).map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Pincode</Label>
                          <Input value={addr.pincode} onChange={(e) => handleShippingAddressChange(addr.id, "pincode", e.target.value)} placeholder="Pincode" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Tax & Legal Information */}
          {currentStep === 3 && (
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-6">Tax & Legal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>GST Number</Label>
                  <Input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="GST123456789" />
                </div>
                <div className="space-y-2">
                  <Label>PAN Number</Label>
                  <Input value={panNumber} onChange={(e) => setPanNumber(e.target.value)} placeholder="PAN123456" />
                </div>
                <div className="space-y-2">
                  <Label>KYC Document</Label>
                  <Input value={kycDocument} onChange={(e) => setKycDocument(e.target.value)} placeholder="Document reference" />
                </div>
                <div className="space-y-2">
                  <Label>Terms of Delivery</Label>
                  <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="Advance" />
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4">
            <div>
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={handlePrevious}>
                  Previous
                </Button>
              )}
            </div>
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
              {currentStep < 3 ? (
                <Button onClick={() => setCurrentStep((s) => s + 1)}>Next</Button>
              ) : (
                <Button onClick={handleSaveEdit}>Save Changes</Button>
              )}
            </div>
          </div>
            </div>
          </div>
        </div>
      </PageShell>
    )
  }

  // Multi-step Add Customer form (full page, 4 steps)
  if (showAddForm && allowed) {
    const steps = [
      { num: 1, title: "Basic Customer Information" },
      { num: 2, title: "Address Details" },
      { num: 3, title: "Taxation, Legal & Financial Details" },
      { num: 4, title: "Compliance & Documentation" },
    ]
    return (
      <PageShell>
        <div className="flex-1 overflow-auto">
          <div className="w-full h-full">
            <PageHeaderWithBack title="Add Customer" noBorder backButton={{ onClick: handleCancelAdd }} />
            <div className="space-y-4 px-6 py-4 h-full">
          <div className="rounded-[10px] border border-border bg-card p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              {steps.map((step, index) => (
                <React.Fragment key={step.num}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(step.num)}
                    className="flex items-center gap-3 hover:opacity-80"
                  >
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                        currentStep >= step.num
                          ? "bg-primary text-primary-foreground"
                          : currentStep === step.num
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {currentStep > step.num ? "✓" : step.num}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        currentStep >= step.num ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.title}
                    </span>
                  </button>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 ${
                        currentStep > step.num ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Basic Customer Information</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Customer Code *</Label>
                    <Input value={customerCode} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>Customer Name *</Label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Customer Type *</Label>
                    <Select value={customerType} onValueChange={setCustomerType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Individual">Individual</SelectItem>
                        <SelectItem value="Company">Company</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Person</Label>
                    <Input
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="Contact person"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="Mobile"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Alternate Mobile (Optional)</Label>
                    <Input
                      value={alternateMobileNumber}
                      onChange={(e) => setAlternateMobileNumber(e.target.value)}
                      placeholder="Alternate mobile"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Website (Optional)</Label>
                    <Input
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="Website"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Industry Type *</Label>
                    <Select value={industryType} onValueChange={setIndustryType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRY_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Channel Type *</Label>
                    <Select value={channelType} onValueChange={setChannelType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {CHANNEL_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Address Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Billing Address *</Label>
                    <Textarea
                      value={billingAddress}
                      onChange={(e) => setBillingAddress(e.target.value)}
                      placeholder="Billing address"
                      className="min-h-[96px]"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>State *</Label>
                      <Select
                        value={state}
                        onValueChange={(v) => {
                          setState(v)
                          setCity("")
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDIAN_STATES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Country *</Label>
                      <Select value={country} onValueChange={setCountry}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="India">India</SelectItem>
                          <SelectItem value="USA">USA</SelectItem>
                          <SelectItem value="UK">UK</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>City *</Label>
                      <Select value={city || undefined} onValueChange={setCity} disabled={!state}>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={state ? "Select city" : "Select state first"}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {cityOptionsForState(state, city).map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Pincode *</Label>
                      <Input
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="Pincode"
                      />
                    </div>
                  </div>
                </div>
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Shipping Addresses</h3>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddShippingAddress}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Shipping Address
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {shippingAddresses.map((addr, index) => (
                      <div key={addr.id} className="rounded-lg border p-4 bg-muted/50">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-medium text-sm">Shipping Address {index + 1}</span>
                          {shippingAddresses.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemoveShippingAddress(addr.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label>Address *</Label>
                            <Textarea
                              value={addr.address}
                              onChange={(e) =>
                                handleShippingAddressChange(addr.id, "address", e.target.value)
                              }
                              placeholder="Shipping address"
                              className="min-h-[96px]"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>State *</Label>
                            <Select
                              value={addr.state}
                              onValueChange={(v) =>
                                handleShippingAddressChange(addr.id, "state", v)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="State" />
                              </SelectTrigger>
                              <SelectContent>
                                {INDIAN_STATES.map((s) => (
                                  <SelectItem key={s} value={s}>
                                    {s}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>City *</Label>
                            <Select
                              value={addr.city || undefined}
                              onValueChange={(v) =>
                                handleShippingAddressChange(addr.id, "city", v)
                              }
                              disabled={!addr.state}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    addr.state ? "Select city" : "Select state first"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {cityOptionsForState(addr.state, addr.city).map((c) => (
                                  <SelectItem key={c} value={c}>
                                    {c}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Pincode *</Label>
                            <Input
                              value={addr.pincode}
                              onChange={(e) =>
                                handleShippingAddressChange(addr.id, "pincode", e.target.value)
                              }
                              placeholder="Pincode"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Taxation, Legal & Financial Details</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>GST Registration Type</Label>
                    <Select value={gstRegistrationType} onValueChange={setGstRegistrationType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Regular">Regular</SelectItem>
                        <SelectItem value="Composition">Composition</SelectItem>
                        <SelectItem value="Unregistered">Unregistered</SelectItem>
                        <SelectItem value="Consumer">Consumer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>GST Number</Label>
                    <Input
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value)}
                      placeholder="Enter GST number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State Code</Label>
                    <Input
                      value={stateCode}
                      onChange={(e) => setStateCode(e.target.value)}
                      placeholder="Enter state code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>PAN Number</Label>
                    <Input
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value)}
                      placeholder="Enter PAN number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tax Filing Frequency</Label>
                    <Select value={taxFilingFrequency} onValueChange={setTaxFilingFrequency}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Quarterly">Quarterly</SelectItem>
                        <SelectItem value="Annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Terms</Label>
                    <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select terms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Immediate">Immediate</SelectItem>
                        <SelectItem value="Net 15 Days">Net 15 Days</SelectItem>
                        <SelectItem value="Net 30 Days">Net 30 Days</SelectItem>
                        <SelectItem value="Net 45 Days">Net 45 Days</SelectItem>
                        <SelectItem value="Net 60 Days">Net 60 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Credit Limit</Label>
                    <Input
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                      placeholder="Enter credit limit"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Opening Balance</Label>
                    <Input
                      value={openingBalance}
                      onChange={(e) => setOpeningBalance(e.target.value)}
                      placeholder="Enter opening balance"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Enter bank name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Enter account number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IFSC Code</Label>
                    <Input
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value)}
                      placeholder="Enter IFSC code"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Compliance & Documentation</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>KYC Document</Label>
                    <Input
                      value={kycDocument}
                      onChange={(e) => setKycDocument(e.target.value)}
                      placeholder="Document reference"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Trade License Number</Label>
                    <Input
                      value={tradeLicenseNumber}
                      onChange={(e) => setTradeLicenseNumber(e.target.value)}
                      placeholder="Enter trade license number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IEC Code</Label>
                    <Input
                      value={iecCode}
                      onChange={(e) => setIecCode(e.target.value)}
                      placeholder="Enter IEC code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>MSME Registration</Label>
                    <Input
                      value={msmeRegistration}
                      onChange={(e) => setMsmeRegistration(e.target.value)}
                      placeholder="Enter MSME registration"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supporting-documents-upload">Supporting Documents</Label>
                    <input
                      ref={supportingDocsInputRef}
                      id="supporting-documents-upload"
                      type="file"
                      multiple
                      className="sr-only"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,application/pdf,image/*"
                      onChange={(e) => {
                        const files = e.target.files
                        if (!files?.length) return
                        setSupportingDocuments(Array.from(files).map((f) => f.name).join(", "))
                      }}
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-center"
                        onClick={() => supportingDocsInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2 shrink-0" aria-hidden />
                        Upload files
                      </Button>
                      <p className="text-xs text-muted-foreground line-clamp-2" title={supportingDocuments || undefined}>
                        {supportingDocuments ? supportingDocuments : "No files selected"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Customer Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 text-sm">
                      <div className="space-y-0.5">
                        <p className="text-muted-foreground">Customer Name:</p>
                        <p className="font-medium">{customerName || "—"}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-muted-foreground">Email:</p>
                        <p className="font-medium">{email || "—"}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-muted-foreground">Mobile:</p>
                        <p className="font-medium">{mobileNumber || "—"}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-muted-foreground">Total Shipping Addresses:</p>
                        <p className="font-medium">{shippingAddresses.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelAdd}
              >
                Cancel
              </Button>
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={handlePrevious}>
                  Previous
                </Button>
              )}
              <Button onClick={handleNext}>
                {currentStep === 4 ? "Save" : "Next"}
              </Button>
            </div>
          </div>
            </div>
          </div>
        </div>
      </PageShell>
    )
  }

  // Full-page View Customer (when View is clicked)
  if (mode === "view" && selectedId && allowed) {
    const viewCustomer = data.getCustomer(selectedId)
    if (!viewCustomer) {
      setMode(null)
      setSelectedId(null)
      return null
    }
    const createdDate = viewCustomer.created_at
      ? new Date(viewCustomer.created_at).toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—"
    const shippingList: { id: string; address: string }[] = viewCustomer.shipping_addresses_typed?.length
      ? viewCustomer.shipping_addresses_typed.map((a) => ({
          id: a.id,
          address: [a.address, a.city, a.state, a.pincode].filter(Boolean).join(", ") || (a.address ?? ""),
        }))
      : (viewCustomer.shipping_addresses ?? []).map((addr, i) => ({ id: `legacy-${i}`, address: addr }))

    return (
      <PageShell>
        <div className="flex-1 overflow-auto">
          <div className="w-full h-full">
            <PageHeaderWithBack
              title="Customer Details"
              noBorder
              backButton={{
                onClick: () => {
                  setMode(null)
                  setSelectedId(null)
                },
              }}
              actions={
                <Button type="button" onClick={() => openEdit(viewCustomer)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              }
            />
            <div className="space-y-6 w-full px-6">
            {/* Basic Information */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Customer Name</p>
                  <p className="font-medium">{viewCustomer.customer_name ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Customer Type</p>
                  <p className="font-medium">{viewCustomer.customer_type ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary shrink-0" />
                    {viewCustomer.email ?? "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary shrink-0" />
                    {viewCustomer.phone ?? "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Contact Person</p>
                  <p className="font-medium">{viewCustomer.contact_person ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Website</p>
                  <p className="font-medium">{viewCustomer.website ?? "—"}</p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <p className="text-sm text-muted-foreground">Industry Type</p>
                  <p className="font-medium">{viewCustomer.industry_type ?? "—"}</p>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Address Information</h2>
              </div>
              <div className="space-y-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Billing Address</p>
                  <p className="font-medium">{viewCustomer.billing_address ?? "—"}</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1 text-sm text-muted-foreground">
                    <span>City: {viewCustomer.city ?? "—"}</span>
                    <span>State: {viewCustomer.state ?? "—"}</span>
                    <span>Pincode: {viewCustomer.pincode ?? "—"}</span>
                  </div>
                </div>
                {shippingList.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Shipping Addresses</p>
                    <div className="flex flex-col gap-2">
                      {shippingList.map((addr, i) => (
                        <div
                          key={addr.id}
                          className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-4 py-3"
                        >
                          <p className="font-medium text-sm">{addr.address}</p>
                          {i === 0 && (
                            <Badge variant="secondary" className="shrink-0">
                              Default
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tax & Legal Information */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Tax & Legal Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">GST Number</p>
                  <p className="font-medium">{viewCustomer.gst_number ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">PAN Number</p>
                  <p className="font-medium">{viewCustomer.pan_number ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">KYC Document</p>
                  <p className="font-medium">{viewCustomer.kyc_document ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Terms of Delivery</p>
                  <p className="font-medium">{viewCustomer.terms_of_delivery ?? "—"}</p>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Info className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Additional Information</h2>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Created At</p>
                <p className="font-medium">{createdDate}</p>
              </div>
            </div>
            </div>
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <PageHeader
        title="Customer Master"
        actions={
          allowed ? (
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          ) : null
        }
      />
      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {!allowed ? (
          <p className="text-muted-foreground">You do not have permission to view this module.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative w-56 max-w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by code, name, or city"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Industry Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {INDUSTRY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {uniqueCities.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => {
                  if (filteredCustomers.length === 0) return
                  const headers = ["Customer ID", "Customer Name", "Contact Person", "Email", "Mobile Number", "Billing Address", "GST Number", "PAN Number"]
                  const rows = filteredCustomers.map((c) => [
                    c.customer_code ?? c.customer_id,
                    c.customer_name,
                    c.contact_person ?? "",
                    c.email,
                    c.phone,
                    c.billing_address ?? "",
                    c.gst_number ?? "",
                    c.pan_number ?? "",
                  ])
                  const csv = [headers.join(","), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n")
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
                  const link = document.createElement("a")
                  link.href = URL.createObjectURL(blob)
                  link.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`
                  link.click()
                  URL.revokeObjectURL(link.href)
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            {filteredCustomers.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Users className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>No customers yet</EmptyTitle>
                  <EmptyDescription>Create a customer to generate sales orders.</EmptyDescription>
                </EmptyHeader>
                <Button onClick={handleAddNew}>Add Customer</Button>
              </Empty>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer ID</TableHead>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>Contact Person</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Mobile Number</TableHead>
                      <TableHead>Billing Address</TableHead>
                      <TableHead>GST Number</TableHead>
                      <TableHead>PAN Number</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((c) => (
                      <TableRow key={c.customer_id}>
                        <TableCell className="font-medium">
                          {c.customer_code ?? c.customer_id}
                        </TableCell>
                        <TableCell>{c.customer_name}</TableCell>
                        <TableCell>{c.contact_person ?? "—"}</TableCell>
                        <TableCell>{c.email}</TableCell>
                        <TableCell>{c.phone}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{c.billing_address ?? "—"}</TableCell>
                        <TableCell>{c.gst_number ?? "—"}</TableCell>
                        <TableCell>{c.pan_number ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" title="View" onClick={() => openView(c)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Edit" onClick={() => openEdit(c)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </div>

    </PageShell>
  )
}
