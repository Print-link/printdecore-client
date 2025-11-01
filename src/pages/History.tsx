import { useState, useEffect, useCallback } from 'react';
import { FileText, Calendar, Clock, Package, MapPin, Info, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getClientOrders } from '../services/orderApi';

interface OrderDetails {
  artwork: string;
  width: string;
  height: string;
  quantity: string;
  location: string;
  description?: string;
}

interface Submission {
  id: string;
  timestamp: string;
  file: {
    name: string;
    size: number;
  };
  orderDetails: OrderDetails;
  status: 'pending' | 'completed' | 'failed';
}

export const History = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubmissions = useCallback(async () => {
    if (!user?._id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getClientOrders(user?._id);
      
      if (response.success && response.data?.orders) {
        // Map backend orders to Submission interface
        const mappedSubmissions: Submission[] = response.data.orders.map((order: any) => ({
          id: order._id || order.id || Date.now().toString(),
          timestamp: order.createdAt || order.timestamp || new Date().toISOString(),
          file: {
            name: order.pdfFile?.originalname || order.fileName || order.file?.name || 'Unknown file',
            size: order.pdfFile?.size || order.fileSize || order.file?.size || 0,
          },
          orderDetails: {
            artwork: order.artwork || '',
            width: order.width || '',
            height: order.height || '',
            quantity: order.quantity?.toString() || '1',
            location: order.location || '',
            description: order.description || '',
          },
          status: (order.status || 'pending') as 'pending' | 'completed' | 'failed',
        }));
        
        setSubmissions(mappedSubmissions);
      } else {
        setSubmissions([]);
      }
    } catch (err: any) {
      console.error('Error loading submissions:', err);
      setError(err.message || 'Failed to load submission history');
      // Fallback to localStorage if API fails
      const stored = localStorage.getItem('submissions');
      if (stored) {
        try {
          setSubmissions(JSON.parse(stored));
        } catch (parseError) {
          console.error('Error parsing localStorage submissions:', parseError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    if (user?._id) {
      loadSubmissions();
    } else {
      setIsLoading(false);
    }
  }, [user?._id, loadSubmissions]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredSubmissions = submissions.filter(sub => 
    filter === 'all' || sub.status === filter
  );

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Submission History</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              View all your print job submissions
            </p>
          </div>
          <div className="flex flex-row flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
                filter === 'pending'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
                filter === 'completed'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
                filter === 'failed'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Failed
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Error loading submissions</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
            <p className="text-gray-500 text-base sm:text-lg font-medium">Loading submissions...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <p className="text-gray-500 text-base sm:text-lg font-medium">No submissions found</p>
            <p className="text-gray-400 text-xs sm:text-sm mt-2 px-4">
              {filter === 'all'
                ? 'Submit your first print job to see it here'
                : `No ${filter} submissions found`}
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                  <div className="flex items-start space-x-2 sm:space-x-4 flex-1 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-1 sm:mb-2 gap-1 sm:gap-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                          {submission.orderDetails.artwork}
                        </h3>
                        {getStatusBadge(submission.status)}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">
                        {submission.file.name} • {formatFileSize(submission.file.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-500 text-sm shrink-0">
                    {getStatusIcon(submission.status)}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                  <div className="flex items-start space-x-2">
                    <Package className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Size</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">
                        {submission.orderDetails.width} × {submission.orderDetails.height}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Package className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Quantity</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">
                        {submission.orderDetails.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {submission.orderDetails.location}
                      </p>
                    </div>
                  </div>
                  {submission.orderDetails.description && (
                    <div className="flex items-start space-x-2 sm:col-span-2 lg:col-span-3">
                      <Info className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500">Description</p>
                        <p className="text-xs sm:text-sm text-gray-700 break-word">
                          {submission.orderDetails.description}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start space-x-2 sm:col-span-2 lg:col-span-3">
                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Submitted</p>
                      <p className="text-xs sm:text-sm text-gray-700">
                        {formatDate(submission.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

