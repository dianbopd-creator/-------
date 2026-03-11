import useSWR from 'swr';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

// Custom fetcher that automatically attaches the JWT token
const authFetcher = async (url) => {
    const token = localStorage.getItem('adminToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, { headers });

    if (!res.ok) {
        const info = await res.json().catch(() => ({}));
        const error = new Error(info.error || 'An error occurred while fetching the data.');
        error.status = res.status;
        throw error;
    }

    return res.json();
};

export const useCandidates = () => {
    const { data, error, isLoading, mutate } = useSWR(`${apiUrl}/admin/candidates`, authFetcher, {
        revalidateOnFocus: true,
        dedupingInterval: 5000 // Prevent duplicate requests within 5 seconds
    });

    return {
        candidates: data?.data || [],
        isLoading,
        isError: error,
        mutateCandidates: mutate
    };
};

export const useCategories = () => {
    const { data, error, isLoading, mutate } = useSWR(`${apiUrl}/categories`, authFetcher, {
        revalidateOnFocus: false, // Categories rarely change, no need to frequently revalidate
        dedupingInterval: 60000
    });

    return {
        categories: data?.data || [],
        isLoading,
        isError: error,
        mutateCategories: mutate
    };
};

export const useTags = () => {
    const { data, error, isLoading, mutate } = useSWR(`${apiUrl}/admin/tags`, authFetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60000
    });

    return {
        tags: data?.data || [],
        isLoading,
        isError: error,
        mutateTags: mutate
    };
};

export const useCandidate = (id) => {
    const { data, error, isLoading, mutate } = useSWR(id ? `${apiUrl}/admin/candidates/${id}` : null, authFetcher);

    return {
        data: data,
        isLoading,
        isError: error,
        mutateCandidate: mutate
    };
};

export const useComments = (id) => {
    const { data, error, isLoading, mutate } = useSWR(id ? `${apiUrl}/admin/candidates/${id}/comments` : null, authFetcher);

    return {
        comments: data || [],
        isLoading,
        isError: error,
        mutateComments: mutate
    };
};
