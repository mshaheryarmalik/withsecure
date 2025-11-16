"""Simple file-based cache for security assessments."""

import hashlib
import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from .security_state import CISOBrief


class AssessmentCache:
    """Simple file-based cache for CISO security assessments."""
    
    def __init__(self, cache_dir: str | None = None, ttl_hours: int = 24):
        """Initialize cache.
        
        Args:
            cache_dir: Directory to store cache files. If None, defaults to backend/.cache/assessments.
            ttl_hours: Time-to-live in hours (default 24)
        """
        if cache_dir is None:
            # Default to backend/.cache/assessments regardless of current working directory
            backend_dir = Path(__file__).resolve().parents[3]
            self.cache_dir = backend_dir / ".cache" / "assessments"
        else:
            self.cache_dir = Path(cache_dir)
            self.ttl_hours = ttl_hours
            self.cache_dir.mkdir(parents=True, exist_ok=True)
    
    def _get_cache_key(
        self,
        product: Optional[str] = None,
        vendor: Optional[str] = None,
        sha1: Optional[str] = None,
        url: Optional[str] = None,
        version: Optional[str] = None,
    ) -> str:
        """Generate cache key from all input fields.
        
        Args:
            product: Product name
            vendor: Vendor name
            sha1: SHA1 hash
            url: URL
            version: Product version
            
        Returns:
            SHA256 hash of normalized input fields
        """
        # Create a dictionary of all non-None fields, sorted for consistency
        fields = {}
        if product:
            fields['product'] = product.strip().lower()
        if vendor:
            fields['vendor'] = vendor.strip().lower()
        if sha1:
            fields['sha1'] = sha1.strip().lower()
        if url:
            fields['url'] = url.strip().lower()
        if version:
            fields['version'] = version.strip().lower()
        
        # Convert to JSON string for hashing (ensures consistent ordering)
        normalized = json.dumps(fields, sort_keys=True)
        # Generate SHA256 hash
        return hashlib.sha256(normalized.encode()).hexdigest()
    
    def _get_cache_path(self, cache_key: str) -> Path:
        """Get path to cache file."""
        return self.cache_dir / f"{cache_key}.json"
    
    def get(
        self,
        product: Optional[str] = None,
        vendor: Optional[str] = None,
        sha1: Optional[str] = None,
        url: Optional[str] = None,
        version: Optional[str] = None,
    ) -> Optional[CISOBrief]:
        """Retrieve cached assessment if available and not expired.
        
        Args:
            product: Product name
            vendor: Vendor name
            sha1: SHA1 hash
            url: URL
            version: Product version
            
        Returns:
            CISOBrief if cached and valid, None otherwise
        """
        try:
            cache_key = self._get_cache_key(product, vendor, sha1, url, version)
            cache_path = self._get_cache_path(cache_key)
            
            if not cache_path.exists():
                return None
            
            # Read cache file
            with open(cache_path, 'r') as f:
                cache_data = json.load(f)
            
            # Check TTL
            cached_time = datetime.fromisoformat(cache_data['cached_at'])
            if datetime.now() - cached_time > timedelta(hours=self.ttl_hours):
                # Expired, delete cache
                cache_path.unlink()
                return None
            
            # Reconstruct CISOBrief
            brief_data = cache_data['brief']
            
            # Fix datetime field
            if 'assessment_timestamp' in brief_data:
                brief_data['assessment_timestamp'] = datetime.fromisoformat(
                    brief_data['assessment_timestamp']
                )
            
            return CISOBrief(**brief_data)
        except Exception as e:
            # On any error, return None (cache miss)
            print(f"Cache read error: {e}")
            return None
    
    def set(
        self,
        brief: CISOBrief,
        product: Optional[str] = None,
        vendor: Optional[str] = None,
        sha1: Optional[str] = None,
        url: Optional[str] = None,
        version: Optional[str] = None,
    ) -> None:
        """Store assessment in cache.
        
        Args:
            brief: CISOBrief to cache
            product: Product name
            vendor: Vendor name
            sha1: SHA1 hash
            url: URL
            version: Product version
        """
        try:
            cache_key = self._get_cache_key(product, vendor, sha1, url, version)
            cache_path = self._get_cache_path(cache_key)
            
            # Prepare cache data
            cache_data = {
                'cached_at': datetime.now().isoformat(),
                'product': product,
                'vendor': vendor,
                'sha1': sha1,
                'url': url,
                'version': version,
                'brief': brief.model_dump(mode='json'),
            }
            
            # Write to cache
            with open(cache_path, 'w') as f:
                json.dump(cache_data, f, indent=2, default=str)
        except Exception as e:
            # On error, silently fail (caching is optional)
            print(f"Cache write error: {e}")
    
    def clear(self) -> int:
        """Clear all cached assessments.
        
        Returns:
            Number of cache files deleted
        """
        count = 0
        try:
            for cache_file in self.cache_dir.glob("*.json"):
                cache_file.unlink()
                count += 1
        except Exception as e:
            print(f"Cache clear error: {e}")
        return count
    
    def stats(self) -> dict:
        """Get cache statistics.
        
        Returns:
            Dictionary with cache stats
        """
        try:
            cache_files = list(self.cache_dir.glob("*.json"))
            total_size = sum(f.stat().st_size for f in cache_files)
            
            valid_count = 0
            expired_count = 0
            
            for cache_file in cache_files:
                try:
                    with open(cache_file, 'r') as f:
                        data = json.load(f)
                    cached_time = datetime.fromisoformat(data['cached_at'])
                    if datetime.now() - cached_time <= timedelta(hours=self.ttl_hours):
                        valid_count += 1
                    else:
                        expired_count += 1
                except Exception:
                    expired_count += 1
            
            return {
                'total_cached': len(cache_files),
                'valid': valid_count,
                'expired': expired_count,
                'total_size_kb': total_size / 1024,
                'cache_dir': str(self.cache_dir),
                'ttl_hours': self.ttl_hours,
            }
        except Exception as e:
            return {'error': str(e)}


# Global cache instance
_default_cache: Optional[AssessmentCache] = None


def get_cache(cache_dir: str = ".cache/assessments", ttl_hours: int = 24) -> AssessmentCache:
    """Get or create the default cache instance.
    
    Args:
        cache_dir: Directory to store cache files
        ttl_hours: Time-to-live in hours
        
    Returns:
        AssessmentCache instance
    """
    global _default_cache
    if _default_cache is None:
        _default_cache = AssessmentCache(cache_dir=cache_dir, ttl_hours=ttl_hours)
    return _default_cache

