// src/components/ProposalCreator.js
import React, { useState, useEffect } from 'react';
import { Plus, Eye, Send, AlertCircle, CheckCircle, Wallet } from 'lucide-react';
import { NounsDaoService } from '../services/nounsDao';

const ProposalCreator = ({ settings, provider, signer, account, isConnected, onConnectWallet }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targets: '',
    values: '',
    signatures: '',
    calldatas: ''
  });
  
  const [isPreview, setIsPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userVotingPower, setUserVotingPower] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const daoService = provider ? new NounsDaoService(provider, signer) : null;

  // Check user's voting power
  useEffect(() => {
    const checkVotingPower = async () => {
      if (daoService && account && isConnected) {
        try {
          const votingPower = await daoService.getVotingPower(account);
          setUserVotingPower(votingPower);
        } catch (error) {
          console.error('Failed to get voting power:', error);
        }
      }
    };

    checkVotingPower();
  }, [daoService, account, isConnected]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
    setSuccess(null);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }
    
    // Basic validation for proposal data
    try {
      if (formData.targets) {
        JSON.parse(formData.targets);
      }
      if (formData.values) {
        JSON.parse(formData.values);
      }
      if (formData.signatures) {
        JSON.parse(formData.signatures);
      }
      if (formData.calldatas) {
        JSON.parse(formData.calldatas);
      }
    } catch (err) {
      setError('Invalid JSON format in proposal data fields');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!isConnected) {
      setError('Please connect your wallet to submit a proposal');
      return;
    }
    if (userVotingPower < 1) {
      setError('You need at least 1 Noun to create a proposal');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Parse proposal data
      const targets = formData.targets ? JSON.parse(formData.targets) : [];
      const values = formData.values ? JSON.parse(formData.values) : [];
      const signatures = formData.signatures ? JSON.parse(formData.signatures) : [];
      const calldatas = formData.calldatas ? JSON.parse(formData.calldatas) : [];

      // Create full description
      const fullDescription = `${formData.title}\n\n${formData.description}`;

      const tx = await daoService.propose(
        targets,
        values,
        signatures,
        calldatas,
        fullDescription
      );

      setSuccess(`Proposal submitted! Transaction: ${tx.hash}`);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        targets: '',
        values: '',
        signatures: '',
        calldatas: ''
      });
      setIsPreview(false);

      // Wait for confirmation
      await tx.wait();
      setSuccess(prev => prev + ' - Confirmed!');

    } catch (error) {
      console.error('Failed to submit proposal:', error);
      setError('Failed to submit proposal: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPreview = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Proposal Preview</h3>
        <button
          onClick={() => setIsPreview(false)}
          className="text-blue-500 hover:text-blue-700"
        >
          Edit
        </button>
      </div>

      <div className="card">
        <h4 className="text-xl font-bold text-gray-900 mb-4">{formData.title}</h4>
        <div className="prose prose-sm max-w-none">
          <pre className="whitespace-pre-wrap text-gray-700 font-sans">
            {formData.description}
          </pre>
        </div>

        {(formData.targets || formData.values || formData.signatures || formData.calldatas) && (
          <div className="mt-6 pt-6 border-t">
            <h5 className="font-medium text-gray-900 mb-3">Proposal Actions</h5>
            <div className="space-y-2 text-sm">
              {formData.targets && (
                <div>
                  <span className="font-medium">Targets:</span>
                  <pre className="mt-1 text-gray-600 text-xs overflow-x-auto">
                    {formData.targets}
                  </pre>
                </div>
              )}
              {formData.values && (
                <div>
                  <span className="font-medium">Values:</span>
                  <pre className="mt-1 text-gray-600 text-xs overflow-x-auto">
                    {formData.values}
                  </pre>
                </div>
              )}
              {formData.signatures && (
                <div>
                  <span className="font-medium">Signatures:</span>
                  <pre className="mt-1 text-gray-600 text-xs overflow-x-auto">
                    {formData.signatures}
                  </pre>
                </div>
              )}
              {formData.calldatas && (
                <div>
                  <span className="font-medium">Calldatas:</span>
                  <pre className="mt-1 text-gray-600 text-xs overflow-x-auto">
                    {formData.calldatas}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setIsPreview(false)}
          className="btn-secondary"
        >
          Back to Edit
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center space-x-2 btn-primary disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span>{isSubmitting ? 'Submitting...' : 'Submit Proposal'}</span>
        </button>
      </div>
    </div>
  );

  if (isPreview) {
    return renderPreview();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Create New Proposal</h2>
        <p className="text-gray-600 mt-1">
          Submit a new governance proposal to the Nouns DAO
        </p>
      </div>

      {/* Voting Power Check */}
      {isConnected && (
        <div className={`card ${userVotingPower >= 1 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center space-x-3">
            {userVotingPower >= 1 ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            )}
            <div>
              <p className={`font-medium ${userVotingPower >= 1 ? 'text-green-800' : 'text-yellow-800'}`}>
                Your Voting Power: {userVotingPower} Noun{userVotingPower !== 1 ? 's' : ''}
              </p>
              <p className={`text-sm ${userVotingPower >= 1 ? 'text-green-600' : 'text-yellow-600'}`}>
                {userVotingPower >= 1 
                  ? 'You can create proposals!' 
                  : 'You need at least 1 Noun to create proposals'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Connection Required */}
      {!isConnected && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Wallet className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">Wallet Connection Required</p>
                <p className="text-sm text-blue-600">
                  Connect your wallet to create and submit proposals
                </p>
              </div>
            </div>
            <button
              onClick={onConnectWallet}
              className="btn-primary"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      )}

      {/* Alert Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-700">{success}</span>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="card">
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Proposal Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="input-field"
                  placeholder="Enter a clear, descriptive title for your proposal"
                  maxLength={200}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.title.length}/200 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  rows={8}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="input-field"
                  placeholder="Provide a detailed description of your proposal, including rationale, implementation details, and expected outcomes..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  Supports markdown formatting
                </p>
              </div>
            </div>
          </div>

          {/* Proposal Actions (Advanced) */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Proposal Actions (Optional)</h3>
            <p className="text-sm text-gray-600 mb-4">
              Define specific contract calls that will be executed if the proposal passes. 
              Leave empty for signal proposals that don't require on-chain execution.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Targets (JSON Array)
                </label>
                <textarea
                  rows={3}
                  value={formData.targets}
                  onChange={(e) => handleChange('targets', e.target.value)}
                  className="input-field font-mono text-sm"
                  placeholder='["0x123...", "0x456..."]'
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Values (JSON Array)
                </label>
                <textarea
                  rows={3}
                  value={formData.values}
                  onChange={(e) => handleChange('values', e.target.value)}
                  className="input-field font-mono text-sm"
                  placeholder='["0", "1000000000000000000"]'
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Signatures (JSON Array)
                </label>
                <textarea
                  rows={3}
                  value={formData.signatures}
                  onChange={(e) => handleChange('signatures', e.target.value)}
                  className="input-field font-mono text-sm"
                  placeholder='["transfer(address,uint256)", ""]'
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calldatas (JSON Array)
                </label>
                <textarea
                  rows={3}
                  value={formData.calldatas}
                  onChange={(e) => handleChange('calldatas', e.target.value)}
                  className="input-field font-mono text-sm"
                  placeholder='["0x", "0xa9059cbb..."]'
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => {
            setFormData({
              title: '',
              description: '',
              targets: '',
              values: '',
              signatures: '',
              calldatas: ''
            });
            setError(null);
            setSuccess(null);
          }}
          className="btn-secondary"
        >
          Clear Form
        </button>
        
        <div className="flex space-x-3">
          <button
            onClick={() => {
              if (validateForm()) {
                setIsPreview(true);
              }
            }}
            disabled={!formData.title.trim() || !formData.description.trim()}
            className="flex items-center space-x-2 btn-secondary disabled:opacity-50"
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>
          
          <button
            onClick={() => {
              if (validateForm()) {
                setIsPreview(true);
              }
            }}
            disabled={!formData.title.trim() || !formData.description.trim() || !isConnected || userVotingPower < 1}
            className="flex items-center space-x-2 btn-primary disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Create Proposal</span>
          </button>
        </div>
      </div>

      {/* Help Text */}
      <div className="card bg-gray-50">
        <h4 className="font-medium text-gray-900 mb-2">💡 Tips for Good Proposals</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Be clear and specific about what you're proposing</li>
          <li>• Include rationale and expected outcomes</li>
          <li>• Consider the cost and feasibility</li>
          <li>• Engage with the community before submitting</li>
          <li>• Test contract interactions on testnet first</li>
        </ul>
      </div>
    </div>
  );
};

export default ProposalCreator;