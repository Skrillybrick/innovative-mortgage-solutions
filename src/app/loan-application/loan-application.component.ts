import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { EmailService } from '../shared/services/email.service';

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
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './loan-application.component.html',
  styleUrl: './loan-application.component.scss'
})
export class LoanApplicationComponent implements OnInit {
  officerId: number | null = null;
  selectedOfficer: LoanOfficer | null = null;
  
  // Application progress tracking
  officerSelectionMode = false; // New state to track if we're on the officer selection step
  officerSelectionForm!: FormGroup;
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
    { id: 1, name: 'Mike DeMie', imageUrl: 'assets/loan-officers/michael_d.jpg' },
    { id: 2, name: 'Emilee Smith', imageUrl: 'assets/loan-officers/emilee_s.png' },
    { id: 3, name: 'José "Hot Taco" Mendoza', imageUrl: 'assets/loan-officers/phil_m.jpeg' },
  ];
  
  // Add a function to select a loan officer
  selectLoanOfficer(): void {
    const selectedId = this.officerSelectionForm.get('selectedOfficerId')?.value;
    if (selectedId) {
      this.officerId = Number(selectedId);
      this.selectedOfficer = this.loanOfficers.find(officer => officer.id === this.officerId) || null;
    }
    this.officerSelectionMode = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  // Skip loan officer selection
  skipOfficerSelection(): void {
    this.officerSelectionMode = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  applicationSubmitted = false;
  
  constructor(
    private route: ActivatedRoute, 
    private router: Router, 
    private fb: FormBuilder,
    private emailService: EmailService
  ) {}
  
  ngOnInit(): void {
    this.initForms();
    
    this.route.queryParams.subscribe(params => {
      if (params['officer']) {
        this.officerId = Number(params['officer']);
        this.selectedOfficer = this.loanOfficers.find(officer => officer.id === this.officerId) || null;
        
        // If coming directly from loan officer selection, scroll to top to show the full page
        if (this.selectedOfficer) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        // If no officer was pre-selected, show the officer selection screen first
        this.officerSelectionMode = true;
      }
    });
  }
  
  initForms(): void {
    // Loan Purpose Form
    this.loanPurposeForm = this.fb.group({
      purpose: ['', [Validators.required]]
    });
    
    // Officer Selection Form (added for the new optional step)
    this.officerSelectionForm = this.fb.group({
      selectedOfficerId: [null]
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
      employer: ['', [Validators.required]],
      jobTitle: ['', [Validators.required]],
      yearsEmployed: ['', [Validators.pattern(/^\d+$/)]],
      creditScore: ['', [Validators.required]],
      monthlyDebt: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      loanType: ['', [Validators.required]]
    });
    
    // Living History Form
    this.livingHistoryForm = this.fb.group({
      // Current residence
      currentResidenceType: ['', [Validators.required]],
      currentResidenceYears: ['0', [Validators.pattern(/^\d+$/)]],
      currentResidenceMonths: ['0', [Validators.pattern(/^\d+$/)]],
      currentMonthlyPayment: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      
      // Previous residences array (required if current residence is less than 2 years)
      previousResidences: this.fb.array([])
    }, { 
      validators: this.atLeastOneTimeValidator('currentResidenceYears', 'currentResidenceMonths')
    });
    
    // Documentation Form with file uploads
    this.documentationForm = this.fb.group({
      idDocument: [null, [Validators.required]],
      incomeDocuments: [null, [Validators.required]],
      bankStatements: [null, [Validators.required]],
      additionalDocuments: [null], // Optional additional documents
      agreeToTerms: [false, [Validators.requiredTrue]]
    });
  }
  
  selectLoanPurpose(): void {
    if (this.loanPurposeForm.valid) {
      const purpose = this.loanPurposeForm.get('purpose')?.value;
      this.isRefinance = purpose === 'refinance';
      this.loanPurposeSelected = true;
      
      // Always scroll to top when selecting loan purpose
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
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
      const currentStep = this.currentStep;
      this.currentStep--;
      
      // On desktop, scroll to the application form top
      // On mobile, only scroll when going back to first step
      if (!this.isMobileDevice()) {
        // Desktop behavior: always scroll to application form
        const pageHeader = document.querySelector('.page-header');
        if (pageHeader) {
          const bottomPosition = pageHeader.getBoundingClientRect().bottom + window.scrollY;
          window.scrollTo({ top: bottomPosition, behavior: 'smooth' });
        }
      } else if (currentStep === 2) {
        // Mobile behavior: only scroll when going back to first step
        const scrollTarget = document.getElementById('scroll-target');
        if (scrollTarget) {
          scrollTarget.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }
  }
  
  nextStep(): void {
    const canProceed = this.validateCurrentStep();
    
    if (canProceed && this.currentStep < this.totalSteps) {
      const previousStep = this.currentStep;
      this.currentStep++;
      
      // On desktop, scroll to the application form top
      // On mobile, only scroll for the first step transition
      if (!this.isMobileDevice()) {
        // Desktop behavior: always scroll to application form
        const pageHeader = document.querySelector('.page-header');
        if (pageHeader) {
          const bottomPosition = pageHeader.getBoundingClientRect().bottom + window.scrollY;
          window.scrollTo({ top: bottomPosition, behavior: 'smooth' });
        }
      } else if (previousStep === 1) {
        // Mobile behavior: only scroll on first step
        const scrollTarget = document.getElementById('scroll-target');
        if (scrollTarget) {
          scrollTarget.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
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
        // Check if form as a whole is valid (includes our custom validator)
        const livingHistoryFormValid = this.livingHistoryForm.valid;
        
        // Check required fields for current residence
        const currentResidenceTypeValid = this.livingHistoryForm.get('currentResidenceType')!.valid;
        const currentMonthlyPaymentValid = this.livingHistoryForm.get('currentMonthlyPayment')!.valid;
        const timeFieldsValid = !this.livingHistoryForm.hasError('atLeastOneTimeRequired');
        
        const currentResidenceValid = currentResidenceTypeValid && currentMonthlyPaymentValid && timeFieldsValid;
          
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
      // Create the FormData object to send to the server
      const formData = new FormData();
      
      // Get all document files
      const idDoc = this.documentationForm.get('idDocument')?.value;
      const incomeFiles = this.documentationForm.get('incomeDocuments')?.value;
      const bankFiles = this.documentationForm.get('bankStatements')?.value;
      const additionalFiles = this.documentationForm.get('additionalDocuments')?.value;
      
      // Add ID document
      if (idDoc) {
        formData.append('idDocument', idDoc);
      }
      
      // Add each income document
      if (incomeFiles) {
        for (let i = 0; i < incomeFiles.length; i++) {
          formData.append('incomeDocuments', incomeFiles[i]);
        }
      }
      
      // Add each bank statement
      if (bankFiles) {
        for (let i = 0; i < bankFiles.length; i++) {
          formData.append('bankStatements', bankFiles[i]);
        }
      }
      
      // Add additional documents if any
      if (additionalFiles) {
        for (let i = 0; i < additionalFiles.length; i++) {
          formData.append('additionalDocuments', additionalFiles[i]);
        }
      }
      
      // Prepare application data
      const applicationData = {
        loanPurpose: this.isRefinance ? 'refinance' : 'purchase',
        personalInfo: this.personalInfoForm.value,
        propertyInfo: this.propertyInfoForm.value,
        financialInfo: this.financialInfoForm.value,
        livingHistory: {
          currentResidence: this.livingHistoryForm.value,
          previousResidences: this.previousResidences.value
        }
      };
      
      // Add application data as JSON string
      formData.append('applicationData', JSON.stringify(applicationData));
      
      // Add loan officer data if selected
      if (this.selectedOfficer) {
        formData.append('loanOfficer', JSON.stringify(this.selectedOfficer));
      }
      
      // TODO - Submit the application data to the server
      // Submit via the EmailService
      // this.emailService.sendLoanApplication(formData).subscribe(
      //   response => {
      //     console.log('Application submitted successfully:', response);
      //     this.applicationSubmitted = true;
          
      //     // Scroll to top for success message - this one should go to the very top
      //     window.scrollTo({ top: 0, behavior: 'smooth' });
      //   },
      //   error => {
      //     console.error('Error submitting application:', error);
      //     // Show error message to user (you can add UI for this)
      //     alert('There was an error submitting your application. Please try again later.');
      //   }
      // );
      this.applicationSubmitted = true;
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
  
  // Helper to get document upload progress percentage
  getDocumentUploadProgress(): number {
    let completedCount = 0;
    if (this.hasFile('idDocument')) completedCount++;
    if (this.hasFile('incomeDocuments')) completedCount++;
    if (this.hasFile('bankStatements')) completedCount++;
    
    return (completedCount / 3) * 100;
  }
  
  // Create a new previous residence form group
  createPreviousResidenceFormGroup(): FormGroup {
    return this.fb.group({
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]],
      residenceType: ['', [Validators.required]],
      years: ['0', [Validators.pattern(/^\d+$/)]],
      months: ['0', [Validators.pattern(/^\d+$/)]],
      monthlyPayment: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]]
    }, {
      validators: this.atLeastOneTimeValidator('years', 'months')
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
  
  // File handling methods
  onFileSelected(event: any, controlName: string): void {
    // Handle both drop and file input events
    const files = event.type === 'drop' ? event.dataTransfer.files : event.target.files;
    if (files && files.length > 0) {
      // Check for allowed file types
      const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
      let allFilesValid = true;
      let totalSize = 0;
      
      // Check each file's type and size
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        totalSize += file.size;
        
        if (!allowedTypes.includes(fileExtension)) {
          allFilesValid = false;
          console.error(`File ${file.name} has an invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
          // In a real app, you would show an error message to the user
          break;
        }
        
        // Check file size (5MB for single files, 10MB total for multiple)
        const maxSize = controlName === 'idDocument' ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB or 10MB
        if (controlName === 'idDocument' && file.size > maxSize) {
          allFilesValid = false;
          console.error(`File ${file.name} exceeds the maximum size of 5MB`);
          // In a real app, you would show an error message to the user
          break;
        } else if (totalSize > maxSize && controlName !== 'idDocument') {
          allFilesValid = false;
          console.error(`Total file size exceeds the maximum size of 10MB`);
          // In a real app, you would show an error message to the user
          break;
        }
      }
      
      if (allFilesValid) {
        // For multiple files (like income documents or bank statements)
        if (controlName === 'incomeDocuments' || controlName === 'bankStatements' || controlName === 'additionalDocuments') {
          // Get existing files from the control if any
          const existingFiles = this.documentationForm.get(controlName)?.value;
          
          // Create a DataTransfer object to merge existing and new files
          const dataTransfer = new DataTransfer();
          
          // Add existing files if present
          if (existingFiles instanceof FileList && existingFiles.length > 0) {
            Array.from(existingFiles).forEach(file => {
              dataTransfer.items.add(file);
            });
          }
          
          // Add new files
          Array.from<File>(files).forEach(file => {
            dataTransfer.items.add(file);
          });
          
          // Set the combined FileList as the control value
          this.documentationForm.get(controlName)?.setValue(dataTransfer.files);
        } else {
          // For single file (like ID document)
          this.documentationForm.get(controlName)?.setValue(files[0]);
        }
        
        // Mark the control as touched to trigger validation
        this.documentationForm.get(controlName)?.markAsTouched();
      } else {
        // Reset the file input if validation fails
        event.target.value = "";
        
        // In a real app, you would show an error message to the user
        // For now, we'll just log to the console
      }
    }
  }
  
  getFileNames(controlName: string): string[] {
    const control = this.documentationForm.get(controlName);
    if (!control || !control.value) return [];
    
    // For multiple files
    if (controlName === 'incomeDocuments' || controlName === 'bankStatements' || controlName === 'additionalDocuments') {
      const files = control.value as FileList;
      return Array.from(files).map(file => file.name);
    }
    
    // For single file
    const file = control.value as File;
    return [file.name];
  }
  
  removeFile(controlName: string, index?: number): void {
    if (index !== undefined && (controlName === 'incomeDocuments' || controlName === 'bankStatements' || controlName === 'additionalDocuments')) {
      // For multiple files, create a new FileList without the removed file
      const currentFiles = this.documentationForm.get(controlName)?.value as FileList;
      if (currentFiles) {
        const dataTransfer = new DataTransfer();
        Array.from(currentFiles).forEach((file, i) => {
          if (i !== index) {
            dataTransfer.items.add(file);
          }
        });
        this.documentationForm.get(controlName)?.setValue(dataTransfer.files.length > 0 ? dataTransfer.files : null);
      }
    } else {
      // For single file, just clear the control
      this.documentationForm.get(controlName)?.setValue(null);
    }
    
    // Mark the control as touched to trigger validation
    this.documentationForm.get(controlName)?.markAsTouched();
  }
  
  // Check if file is selected
  hasFile(controlName: string): boolean {
    const control = this.documentationForm.get(controlName);
    return !!(control && control.value);
  }
  
  // Format file size for display (e.g., 1.5 MB)
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
  
  // Check if we're on a mobile device
  isMobileDevice(): boolean {
    return window.innerWidth <= 768;
  }
  
  // Custom validator to require at least one of years or months to be greater than 0
  atLeastOneTimeValidator(yearsControlName: string, monthsControlName: string) {
    return (formGroup: FormGroup) => {
      const years = formGroup.get(yearsControlName);
      const months = formGroup.get(monthsControlName);
      
      if (!years || !months) {
        return null;
      }
      
      const yearsValue = parseInt(years.value || '0');
      const monthsValue = parseInt(months.value || '0');
      
      // Only validate if both have been touched or form has been submitted
      const shouldValidate = (years.touched || months.touched);
      
      if (shouldValidate && yearsValue === 0 && monthsValue === 0) {
        // If both are 0, set the error on the form
        return { atLeastOneTimeRequired: true };
      }
      
      // Clear any previous errors if at least one has a value
      return null;
    };
  }
  
  // Get file size for a specific control
  getFileSize(controlName: string): string {
    const control = this.documentationForm.get(controlName);
    if (!control || !control.value) return '0 Bytes';
    
    if (controlName === 'idDocument') {
      // Single file
      const file = control.value as File;
      return this.formatFileSize(file.size);
    } else {
      // Multiple files
      const files = control.value as FileList;
      let totalSize = 0;
      for (let i = 0; i < files.length; i++) {
        totalSize += files[i].size;
      }
      return this.formatFileSize(totalSize);
    }
  }
}