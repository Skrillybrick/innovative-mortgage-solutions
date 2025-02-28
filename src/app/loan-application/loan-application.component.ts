import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';

interface LoanOfficer {
  id: number;
  name: string;
  imageUrl: string;
}

interface PreviousResidence {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  residenceType: string;
  years: number;
  months: number;
  monthlyPayment: number;
}

@Component({
  selector: 'app-loan-application',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './loan-application.component.html',
  styleUrl: './loan-application.component.scss'
})
export class LoanApplicationComponent implements OnInit {
  officerId: number | null = null;
  selectedOfficer: LoanOfficer | null = null;
  
  // Loan type selection
  loanPurposeForm!: FormGroup;
  loanPurposeSelected = false;
  isRefinance = false;
  
  // Form variables
  currentStep = 1;
  totalSteps = 5;
  personalInfoForm!: FormGroup;
  propertyInfoForm!: FormGroup;
  financialInfoForm!: FormGroup;
  livingHistoryForm!: FormGroup;
  documentationForm!: FormGroup;
  
  // Dropdown options
  loanTypes = [
    { value: 'conventional', label: 'Conventional Loan' },
    { value: 'fha', label: 'FHA Loan' },
    { value: 'va', label: 'VA Loan' },
    { value: 'usda', label: 'USDA Loan' },
    { value: 'jumbo', label: 'Jumbo Loan' }
  ];
  
  propertyTypes = [
    { value: 'single-family', label: 'Single Family Home' },
    { value: 'condo', label: 'Condominium' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'multi-family', label: 'Multi-Family Home' },
    { value: 'manufactured', label: 'Manufactured Home' }
  ];
  
  employmentStatuses = [
    { value: 'employed', label: 'Employed Full-Time' },
    { value: 'self-employed', label: 'Self-Employed' },
    { value: 'part-time', label: 'Employed Part-Time' },
    { value: 'retired', label: 'Retired' },
    { value: 'unemployed', label: 'Unemployed' }
  ];
  
  // Mock loan officers (in a real app, this would come from a service)
  loanOfficers: LoanOfficer[] = [
    { id: 1, name: 'Michael DeMie', imageUrl: 'assets/loan-officers/michael_d.jpg' },
    { id: 2, name: 'Emilee Smith', imageUrl: 'assets/loan-officers/emilee_s.png' },
    { id: 3, name: 'Phil Mendoza', imageUrl: 'assets/loan-officers/phil_m.jpeg' },
  ];
  
  applicationSubmitted = false;
  
  constructor(
    private route: ActivatedRoute, 
    private router: Router, 
    private fb: FormBuilder
  ) {}
  
  ngOnInit(): void {
    this.initForms();
    
    this.route.queryParams.subscribe(params => {
      if (params['officer']) {
        this.officerId = Number(params['officer']);
        this.selectedOfficer = this.loanOfficers.find(officer => officer.id === this.officerId) || null;
      }
    });
  }
  
  initForms(): void {
    // Loan Purpose Form
    this.loanPurposeForm = this.fb.group({
      purpose: ['', [Validators.required]]
    });
    
    // Personal Information Form
    this.personalInfoForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]]
    });
    
    // Property Information Form with conditional validators to be set after purpose selection
    this.propertyInfoForm = this.fb.group({
      propertyType: ['', [Validators.required]],
      // New purchase specific fields - validators will be adjusted based on loan purpose
      propertyAddress: [''],
      propertyCity: [''],
      propertyState: [''],
      propertyZipCode: [''],
      // Fields used by both, but with different labels
      purchasePrice: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      downPayment: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      
      // Refinance specific fields
      currentValue: [''],
      currentLoanBalance: [''],
      refinanceReason: ['']
    });
    
    // Financial Information Form
    this.financialInfoForm = this.fb.group({
      annualIncome: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      employmentStatus: ['', [Validators.required]],
      employer: [''],
      creditScore: ['', [Validators.required]],
      monthlyDebt: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      loanType: ['', [Validators.required]]
    });
    
    // Living History Form
    this.livingHistoryForm = this.fb.group({
      // Current residence
      currentResidenceType: ['', [Validators.required]],
      currentResidenceYears: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      currentResidenceMonths: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      currentMonthlyPayment: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      
      // Previous residences array (required if current residence is less than 2 years)
      previousResidences: this.fb.array([])
    });
    
    // Documentation Form
    this.documentationForm = this.fb.group({
      idUploaded: [false, [Validators.requiredTrue]],
      proofOfIncomeUploaded: [false, [Validators.requiredTrue]],
      bankStatementsUploaded: [false, [Validators.requiredTrue]],
      agreeToTerms: [false, [Validators.requiredTrue]]
    });
  }
  
  selectLoanPurpose(): void {
    if (this.loanPurposeForm.valid) {
      const purpose = this.loanPurposeForm.get('purpose')?.value;
      this.isRefinance = purpose === 'refinance';
      this.loanPurposeSelected = true;
      
      // Reset the property form values
      this.propertyInfoForm.reset({
        propertyType: ''
      });
      
      // Update property form validators based on the loan purpose
      if (this.isRefinance) {
        // For refinance, add validators to refinance-specific fields
        this.propertyInfoForm.get('currentValue')?.setValidators([Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]);
        this.propertyInfoForm.get('currentLoanBalance')?.setValidators([Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]);
        this.propertyInfoForm.get('refinanceReason')?.setValidators([Validators.required]);
        
        // For refinance, we don't need property address validations
        this.propertyInfoForm.get('propertyAddress')?.clearValidators();
        this.propertyInfoForm.get('propertyCity')?.clearValidators();
        this.propertyInfoForm.get('propertyState')?.clearValidators();
        this.propertyInfoForm.get('propertyZipCode')?.clearValidators();
      } else {
        // For new purchase, add validators to property details fields
        this.propertyInfoForm.get('propertyAddress')?.setValidators([Validators.required]);
        this.propertyInfoForm.get('propertyCity')?.setValidators([Validators.required]);
        this.propertyInfoForm.get('propertyState')?.setValidators([Validators.required]);
        this.propertyInfoForm.get('propertyZipCode')?.setValidators([Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]);
        
        // For new purchase, clear refinance-specific validators
        this.propertyInfoForm.get('currentValue')?.clearValidators();
        this.propertyInfoForm.get('currentLoanBalance')?.clearValidators();
        this.propertyInfoForm.get('refinanceReason')?.clearValidators();
      }
      
      // Update validation status for all fields
      Object.keys(this.propertyInfoForm.controls).forEach(key => {
        this.propertyInfoForm.get(key)?.updateValueAndValidity();
      });
      
      console.log('Loan purpose selected:', this.isRefinance ? 'Refinance' : 'New Purchase');
      console.log('Property form status:', this.propertyInfoForm.status);
    }
  }
  
  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }
  
  nextStep(): void {
    const canProceed = this.validateCurrentStep();
    
    if (canProceed && this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }
  
  validateCurrentStep(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.personalInfoForm.valid;
      case 2:
        if (this.isRefinance) {
          // Check only the fields that are relevant for refinance
          const propertyType = this.propertyInfoForm.get('propertyType')!.valid;
          const currentValue = this.propertyInfoForm.get('currentValue')!.valid;
          const currentLoanBalance = this.propertyInfoForm.get('currentLoanBalance')!.valid;
          const refinanceReason = this.propertyInfoForm.get('refinanceReason')!.valid;
          const purchasePrice = this.propertyInfoForm.get('purchasePrice')!.valid; // cash out amount
          const downPayment = this.propertyInfoForm.get('downPayment')!.valid; // years remaining
          
          return propertyType && currentValue && currentLoanBalance && refinanceReason && 
                 purchasePrice && downPayment;
        } else {
          // Check only the fields that are relevant for new purchase
          const propertyType = this.propertyInfoForm.get('propertyType')!.valid;
          const propertyAddress = this.propertyInfoForm.get('propertyAddress')!.valid;
          const propertyCity = this.propertyInfoForm.get('propertyCity')!.valid;
          const propertyState = this.propertyInfoForm.get('propertyState')!.valid;
          const propertyZipCode = this.propertyInfoForm.get('propertyZipCode')!.valid;
          const purchasePrice = this.propertyInfoForm.get('purchasePrice')!.valid;
          const downPayment = this.propertyInfoForm.get('downPayment')!.valid;
          
          return propertyType && propertyAddress && propertyCity && propertyState && 
                 propertyZipCode && purchasePrice && downPayment;
        }
      case 3:
        return this.financialInfoForm.valid;
      case 4:
        // Check required fields for current residence
        const currentResidenceValid = 
          this.livingHistoryForm.get('currentResidenceType')!.valid &&
          this.livingHistoryForm.get('currentResidenceYears')!.valid &&
          this.livingHistoryForm.get('currentResidenceMonths')!.valid &&
          this.livingHistoryForm.get('currentMonthlyPayment')!.valid;
          
        // Get total months at current residence
        const totalMonths = this.getTotalMonthsAtCurrentResidence();
        
        // If less than 24 months at current residence, check previous residences
        if (totalMonths < 24) {
          // First, check if we have at least one previous residence
          if (this.previousResidences.length === 0) {
            return false;
          }
          
          // Check if all previous residences are valid
          let allPreviousResidencesValid = true;
          for (let i = 0; i < this.previousResidences.length; i++) {
            if (!this.previousResidences.at(i).valid) {
              allPreviousResidencesValid = false;
              break;
            }
          }
          
          // Check if we have enough residence history (at least 24 months total)
          const hasEnoughHistory = this.hasEnoughResidenceHistory();
          
          return currentResidenceValid && allPreviousResidencesValid && hasEnoughHistory;
        }
        
        return currentResidenceValid;
      case 5:
        return this.documentationForm.valid;
      default:
        return false;
    }
  }
  
  isCurrentStepValid(): boolean {
    // For debugging - log the validation state
    if (this.currentStep === 2) {
      console.log('Property form valid:', this.propertyInfoForm.valid);
      console.log('Form values:', this.propertyInfoForm.value);
      console.log('Form errors:', this.getFormValidationErrors(this.propertyInfoForm));
    }
    
    if (this.currentStep === 4) {
      console.log('Living History form valid:', this.livingHistoryForm.valid);
      console.log('Form values:', this.livingHistoryForm.value);
      console.log('Form errors:', this.getFormValidationErrors(this.livingHistoryForm));
    }
    
    return this.validateCurrentStep();
  }
  
  // Helper to get all form validation errors
  getFormValidationErrors(form: FormGroup): any {
    const result = {};
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control?.errors) {
        Object.assign(result, { [key]: control.errors });
      }
    });
    return result;
  }
  
  submitApplication(): void {
    if (this.documentationForm.valid) {
      // In a real application, this is where you would call a service to submit the form data
      console.log('Application Submitted!');
      console.log('Loan Purpose:', this.isRefinance ? 'Refinance' : 'New Purchase');
      console.log('Personal Info:', this.personalInfoForm.value);
      console.log('Property Info:', this.propertyInfoForm.value);
      console.log('Financial Info:', this.financialInfoForm.value);
      console.log('Living History:', this.livingHistoryForm.value);
      console.log('Documentation:', this.documentationForm.value);
      
      this.applicationSubmitted = true;
    }
  }
  
  navigateToHome(): void {
    this.router.navigate(['/']);
  }
  
  getStepTitle(step: number): string {
    switch (step) {
      case 1:
        return 'Personal Information';
      case 2:
        return 'Property Details';
      case 3:
        return 'Financial Information';
      case 4:
        return 'Living History';
      case 5:
        return 'Documentation & Review';
      default:
        return '';
    }
  }
  
  // Credit score options for select dropdown
  getCreditScoreRanges(): {value: string, label: string}[] {
    return [
      { value: 'excellent', label: 'Excellent (740+)' },
      { value: 'very-good', label: 'Very Good (700-739)' },
      { value: 'good', label: 'Good (660-699)' },
      { value: 'fair', label: 'Fair (620-659)' },
      { value: 'poor', label: 'Poor (580-619)' },
      { value: 'very-poor', label: 'Very Poor (Below 580)' }
    ];
  }
  
  // Refinance reason options
  getRefinanceReasons(): {value: string, label: string}[] {
    return [
      { value: 'lower-rate', label: 'Lower Interest Rate' },
      { value: 'cash-out', label: 'Cash-Out Refinance' },
      { value: 'shorten-term', label: 'Shorten Loan Term' },
      { value: 'switch-to-fixed', label: 'Switch to Fixed Rate' },
      { value: 'remove-pmi', label: 'Remove Private Mortgage Insurance (PMI)' },
      { value: 'consolidate-debt', label: 'Consolidate Debt' }
    ];
  }
  
  // Residence type options for living history
  getResidenceTypes(): {value: string, label: string}[] {
    return [
      { value: 'own', label: 'Own' },
      { value: 'rent', label: 'Rent' },
      { value: 'living-with-family', label: 'Living with Family' },
      { value: 'military-housing', label: 'Military Housing' },
      { value: 'other', label: 'Other' }
    ];
  }
  
  // Helper for control validation
  hasError(formGroup: FormGroup, controlName: string, errorType: string): boolean {
    const control = formGroup.get(controlName);
    return control !== null && control.hasError(errorType) && (control.dirty || control.touched);
  }
  
  // Helper to get total months at current residence
  getTotalMonthsAtCurrentResidence(): number {
    const years = parseInt(this.livingHistoryForm.get('currentResidenceYears')?.value || '0');
    const months = parseInt(this.livingHistoryForm.get('currentResidenceMonths')?.value || '0');
    return (years * 12) + months;
  }
  
  // Helper to update previous residence validators based on current residence duration
  // Access the previous residences form array
  get previousResidences() {
    return this.livingHistoryForm.get('previousResidences') as FormArray;
  }
  
  // Create a new previous residence form group
  createPreviousResidenceFormGroup(): FormGroup {
    return this.fb.group({
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]],
      residenceType: ['', [Validators.required]],
      years: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      months: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      monthlyPayment: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]]
    });
  }
  
  // Add a new previous residence
  addPreviousResidence(): void {
    this.previousResidences.push(this.createPreviousResidenceFormGroup());
  }
  
  // Remove a previous residence
  removePreviousResidence(index: number): void {
    this.previousResidences.removeAt(index);
  }
  
  // Calculate total months of residence history
  getTotalResidenceHistoryMonths(): number {
    let totalMonths = this.getTotalMonthsAtCurrentResidence();
    
    // Add months from all previous residences
    for (let i = 0; i < this.previousResidences.length; i++) {
      const previousResidence = this.previousResidences.at(i) as FormGroup;
      const years = parseInt(previousResidence.get('years')?.value || '0');
      const months = parseInt(previousResidence.get('months')?.value || '0');
      totalMonths += (years * 12) + months;
    }
    
    return totalMonths;
  }
  
  // Check if we have enough residence history (at least 24 months)
  hasEnoughResidenceHistory(): boolean {
    return this.getTotalResidenceHistoryMonths() >= 24;
  }
  
  updatePreviousResidenceValidators(): void {
    const totalMonths = this.getTotalMonthsAtCurrentResidence();
    
    // If less than 24 months at current residence and no previous residences yet, add one
    if (totalMonths < 24 && this.previousResidences.length === 0) {
      this.addPreviousResidence();
    }
  }
  
  resetLoanPurpose(): void {
    this.loanPurposeSelected = false;
    this.loanPurposeForm.reset();
  }
}