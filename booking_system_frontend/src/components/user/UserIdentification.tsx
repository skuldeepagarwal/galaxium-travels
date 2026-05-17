import { useState } from 'react';
import { Modal, Input, Button } from '../common';
import { getUserByCredentials, registerUser, isErrorResponse } from '../../services/api';
import { useUser } from '../../hooks/useUser';
import toast from 'react-hot-toast';

interface UserIdentificationProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Email validation regex pattern (RFC 5322 compliant)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Validates email address format and constraints
 * @param email - Email address to validate
 * @returns Object with validation result and error message
 */
const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  // Check for empty or whitespace-only input
  if (!email || !email.trim()) {
    return { isValid: false, error: 'Email address is required' };
  }

  const trimmedEmail = email.trim().toLowerCase();

  // Check length constraints (RFC 5321)
  if (trimmedEmail.length > 254) {
    return { isValid: false, error: 'Email address is too long (max 254 characters)' };
  }

  // Validate format using regex
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  // Check for consecutive dots
  if (trimmedEmail.includes('..')) {
    return { isValid: false, error: 'Email cannot contain consecutive dots' };
  }

  // Validate local part (before @) length
  const [localPart] = trimmedEmail.split('@');
  if (localPart.length > 64) {
    return { isValid: false, error: 'Email local part is too long (max 64 characters)' };
  }

  return { isValid: true };
};

/**
 * Validates name input
 * @param name - Name to validate
 * @returns Object with validation result and error message
 */
const validateName = (name: string): { isValid: boolean; error?: string } => {
  if (!name || !name.trim()) {
    return { isValid: false, error: 'Name is required' };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }

  if (trimmedName.length > 100) {
    return { isValid: false, error: 'Name is too long (max 100 characters)' };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
    return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }

  return { isValid: true };
};

export const UserIdentification = ({ isOpen, onClose, onSuccess }: UserIdentificationProps) => {
  const { setUser } = useUser();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate name
    const nameValidation = validateName(name);
    if (!nameValidation.isValid) {
      toast.error(nameValidation.error || 'Invalid name');
      return;
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      toast.error(emailValidation.error || 'Invalid email');
      return;
    }

    setIsLoading(true);

    try {
      if (isNewUser) {
        // Register new user
        const result = await registerUser({ name: name.trim(), email: email.trim() });
        
        if (isErrorResponse(result)) {
          toast.error(result.details || result.error);
          return;
        }
        
        setUser(result);
        toast.success('Account created successfully!');
        onSuccess();
        onClose();
      } else {
        // Try to find existing user
        const result = await getUserByCredentials(name.trim(), email.trim());
        
        if (isErrorResponse(result)) {
          // User not found, suggest registration
          toast.error('User not found. Please register or check your credentials.');
          setIsNewUser(true);
          return;
        }
        
        setUser(result);
        toast.success(`Welcome back, ${result.name}!`);
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      toast.error(error.details || error.error || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setEmail('');
    setIsNewUser(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isNewUser ? 'Create Account' : 'Sign In'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-star-white/70 text-sm mb-4">
          {isNewUser
            ? 'Create an account to book your flight'
            : 'Enter your name and email to continue'}
        </p>

        <Input
          label="Name"
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          label="Email"
          type="email"
          placeholder="john@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="flex flex-col gap-3 pt-4">
          <Button type="submit" isLoading={isLoading} className="w-full">
            {isNewUser ? 'Create Account' : 'Continue'}
          </Button>

          <button
            type="button"
            onClick={() => setIsNewUser(!isNewUser)}
            className="text-sm text-cosmic-purple hover:text-nebula-pink transition-colors"
          >
            {isNewUser
              ? 'Already have an account? Sign in'
              : "Don't have an account? Register"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Made with Bob
